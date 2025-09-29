// Event processor for wallet-based event consumption

import type { EventProcessor as IEventProcessor, EventStore, DurableEventsConfig } from '../types/durableEvents';
import type { EventType } from '../types/internal';
import type { WalletManager } from './WalletManager';
import type { SessionManager } from './SessionManager';
import type { EventRouter } from './EventRouter';
import type { EventEmitter } from './EventEmitter';
import { globalLogger } from './Logger';

const log = globalLogger.createChild('EventProcessor');

export interface EventProcessorConfig {
    disableEvents?: boolean;
}

/**
 * Processes durable events for wallets based on their active sessions and enabled event types
 */
export class StorageEventProcessor implements IEventProcessor {
    private eventStore: EventStore;
    private config: DurableEventsConfig;
    private walletManager: WalletManager;
    private sessionManager: SessionManager;
    private eventRouter: EventRouter;
    private eventEmitter: EventEmitter;

    // Active processing loops per wallet
    private processingLoops: Map<string, boolean> = new Map();

    // Wake-up promises for processing loops
    private wakeUpResolvers: Map<string, () => void> = new Map();

    // No-wallet processing loop state
    private noWalletProcessing: boolean = false;
    private noWalletWakeUpResolver?: () => void;

    // Recovery and cleanup timeouts
    private recoveryTimeoutId?: number;
    private cleanupTimeoutId?: number;

    private processorConfig: EventProcessorConfig;

    constructor(
        processorConfig: EventProcessorConfig = {},
        eventStore: EventStore,
        config: DurableEventsConfig,
        walletManager: WalletManager,
        sessionManager: SessionManager,
        eventRouter: EventRouter,
        eventEmitter: EventEmitter,
    ) {
        this.processorConfig = processorConfig;

        this.eventStore = eventStore;
        this.config = config;
        this.walletManager = walletManager;
        this.sessionManager = sessionManager;
        this.eventRouter = eventRouter;
        this.eventEmitter = eventEmitter;

        if (this.processorConfig.disableEvents) {
            return;
        }

        // Listen for bridge storage updates to trigger processing
        this.eventEmitter.on('bridge-storage-updated', () => {
            this.triggerProcessingForAllWallets();
            this.triggerNoWalletProcessing();
        });
    }

    /**
     * Start processing events for a wallet
     */
    async startProcessing(walletAddress: string): Promise<void> {
        if (this.processorConfig.disableEvents) {
            return;
        }

        if (this.processingLoops.get(walletAddress)) {
            log.debug('Processing already active for wallet', { walletAddress });
            return;
        }

        this.processingLoops.set(walletAddress, true);
        log.info('Started event processing for wallet', { walletAddress });

        // Start processing loop
        this.processEventsLoop(walletAddress);
    }

    /**
     * Stop processing events for a wallet
     */
    async stopProcessing(walletAddress: string): Promise<void> {
        if (this.processorConfig.disableEvents) {
            return;
        }

        this.processingLoops.set(walletAddress, false);

        // Wake up the processing loop so it can exit cleanly
        const wakeUpResolver = this.wakeUpResolvers.get(walletAddress);
        if (wakeUpResolver) {
            wakeUpResolver();
            this.wakeUpResolvers.delete(walletAddress);
        }

        log.info('Stopped event processing for wallet', { walletAddress });
    }

    /**
     * Start processing events that don't require a wallet (e.g., connect events)
     */
    async startNoWalletProcessing(): Promise<void> {
        if (this.processorConfig.disableEvents) {
            return;
        }

        if (this.noWalletProcessing) {
            log.debug('No-wallet processing already active');
            return;
        }

        this.noWalletProcessing = true;
        log.info('Started no-wallet event processing');

        // Start processing loop
        this.processNoWalletEventsLoop();
    }

    /**
     * Stop processing events that don't require a wallet
     */
    async stopNoWalletProcessing(): Promise<void> {
        if (this.processorConfig.disableEvents) {
            return;
        }

        this.noWalletProcessing = false;

        // Wake up the processing loop so it can exit cleanly
        if (this.noWalletWakeUpResolver) {
            this.noWalletWakeUpResolver();
            this.noWalletWakeUpResolver = undefined;
        }

        log.info('Stopped no-wallet event processing');
    }

    /**
     * Process next available event for a wallet
     */
    async processNextEvent(walletAddress: string): Promise<boolean> {
        try {
            // Get active sessions for this wallet
            const sessions = this.sessionManager
                .getSessionsForAPI()
                .filter((session) => session.walletAddress === walletAddress);

            if (sessions.length === 0) {
                log.debug('No active sessions for wallet', { walletAddress });
                return false;
            }

            const sessionIds = sessions.map((session) => session.sessionId);

            // Get events ready for processing
            const enabledEventTypes = this.getEnabledEventTypes();
            const events = await this.eventStore.getEventsForWallet(walletAddress, sessionIds, enabledEventTypes);

            if (events.length === 0) {
                return false; // No events to process
            }

            // Try to acquire lock on the first event
            const eventToUse = events[0];
            const acquiredEvent = await this.eventStore.acquireLock(eventToUse.id, walletAddress);

            if (!acquiredEvent) {
                log.debug('Failed to acquire lock on event', { eventId: eventToUse.id, walletAddress });
                return false;
            }

            log.info('Processing event', {
                eventId: acquiredEvent.id,
                eventType: acquiredEvent.eventType,
                walletAddress,
                sessionId: acquiredEvent.sessionId,
            });

            // Process the event through existing EventRouter
            try {
                await this.eventRouter.routeEvent({
                    ...acquiredEvent.rawEvent,
                    walletAddress,
                });

                // Mark as completed
                await this.eventStore.updateEventStatus(acquiredEvent.id, 'completed', 'processing');

                log.info('Event processing completed', { eventId: acquiredEvent.id });
                return true;
            } catch (error) {
                log.error('Error processing event', {
                    eventId: acquiredEvent.id,
                    error: (error as Error).message,
                });

                // Leave event in processing state - recovery will handle it
                return false;
            }
        } catch (error) {
            log.error('Error in processNextEvent', {
                walletAddress,
                error: (error as Error).message,
            });
            return false;
        }
    }

    /**
     * Process next available event that doesn't require a wallet
     */
    async processNextNoWalletEvent(): Promise<boolean> {
        try {
            // Get events that don't require a wallet (currently only connect events)
            const enabledEventTypes = this.getNoWalletEnabledEventTypes();
            const events = await this.eventStore.getNoWalletEvents(enabledEventTypes);

            if (events.length === 0) {
                return false; // No events to process
            }

            // Try to acquire lock on the first event
            // Use a special "no-wallet" identifier for locking
            const eventToUse = events[0];
            const acquiredEvent = await this.eventStore.acquireLock(
                eventToUse.id,
                eventToUse?.rawEvent?.walletAddress || 'no-wallet',
            );

            if (!acquiredEvent) {
                log.debug('Failed to acquire lock on no-wallet event', { eventId: eventToUse.id });
                return false;
            }

            log.info('Processing no-wallet event', {
                eventId: acquiredEvent.id,
                eventType: acquiredEvent.eventType,
                sessionId: acquiredEvent.sessionId,
            });

            // Process the event through existing EventRouter
            try {
                await this.eventRouter.routeEvent({
                    ...acquiredEvent.rawEvent,
                    // Don't set wallet for no-wallet events
                });

                // Mark as completed
                await this.eventStore.updateEventStatus(acquiredEvent.id, 'completed', 'processing');

                log.info('No-wallet event processing completed', { eventId: acquiredEvent.id });
                return true;
            } catch (error) {
                log.error('Error processing no-wallet event', {
                    eventId: acquiredEvent.id,
                    error: (error as Error).message,
                });

                // Leave event in processing state - recovery will handle it
                return false;
            }
        } catch (error) {
            log.error('Error in processNextNoWalletEvent', {
                error: (error as Error).message,
            });
            return false;
        }
    }

    /**
     * Mark an event as completed after successful processing
     */
    async completeEvent(eventId: string): Promise<void> {
        try {
            await this.eventStore.updateEventStatus(eventId, 'completed', 'processing');
            log.debug('Event marked as completed', { eventId });
        } catch (error) {
            log.error('Failed to mark event as completed', {
                eventId,
                error: (error as Error).message,
            });
        }
    }

    /**
     * Start the recovery process for stale events
     */
    startRecoveryLoop(): void {
        if (this.recoveryTimeoutId) {
            log.debug('Recovery loop already running');
            return;
        }

        // Self-calling timeout for recovery
        const recoveryLoop = async () => {
            try {
                const recoveredCount = await this.eventStore.recoverStaleEvents(this.config.processingTimeoutMs);
                if (recoveredCount > 0) {
                    // Trigger processing for all wallets since we recovered events
                    this.triggerProcessingForAllWallets();
                }
            } catch (error) {
                log.error('Error in recovery loop', { error: (error as Error).message });
            }

            // Schedule next recovery cycle if still running
            if (this.recoveryTimeoutId !== undefined) {
                this.recoveryTimeoutId = setTimeout(recoveryLoop, this.config.recoveryIntervalMs) as unknown as number;
            }
        };

        // Self-calling timeout for cleanup
        const cleanupLoop = async () => {
            try {
                await this.eventStore.cleanupOldEvents(this.config.retentionMs);
            } catch (error) {
                log.error('Error in cleanup loop', { error: (error as Error).message });
            }

            // Schedule next cleanup cycle if still running
            if (this.cleanupTimeoutId !== undefined) {
                this.cleanupTimeoutId = setTimeout(cleanupLoop, this.config.cleanupIntervalMs) as unknown as number;
            }
        };

        // Start both loops
        this.recoveryTimeoutId = setTimeout(recoveryLoop, this.config.recoveryIntervalMs) as unknown as number;
        this.cleanupTimeoutId = setTimeout(cleanupLoop, this.config.cleanupIntervalMs) as unknown as number;

        log.info('Recovery and cleanup loops started');
    }

    /**
     * Stop the recovery process
     */
    stopRecoveryLoop(): void {
        if (this.recoveryTimeoutId) {
            clearTimeout(this.recoveryTimeoutId);
            this.recoveryTimeoutId = undefined;
        }

        if (this.cleanupTimeoutId) {
            clearTimeout(this.cleanupTimeoutId);
            this.cleanupTimeoutId = undefined;
        }

        log.info('Recovery and cleanup loops stopped');
    }

    // Private helper methods

    /**
     * Main processing loop for a wallet
     */
    private async processEventsLoop(walletAddress: string): Promise<void> {
        while (this.processingLoops.get(walletAddress)) {
            try {
                const processed = await this.processNextEvent(walletAddress);

                if (!processed) {
                    // No events processed, wait for either timeout or wake-up signal
                    await this.waitForWakeUpOrTimeout(walletAddress, 1000);
                }
            } catch (error) {
                log.error('Error in processing loop', {
                    walletAddress,
                    error: (error as Error).message,
                });

                // Wait before retrying (shorter timeout for errors)
                await this.waitForWakeUpOrTimeout(walletAddress, 5000);
            }
        }

        // Clean up wake-up resolver
        this.wakeUpResolvers.delete(walletAddress);
        log.debug('Processing loop ended for wallet', { walletAddress });
    }

    /**
     * Main processing loop for no-wallet events
     */
    private async processNoWalletEventsLoop(): Promise<void> {
        while (this.noWalletProcessing) {
            try {
                const processed = await this.processNextNoWalletEvent();

                if (!processed) {
                    // No events processed, wait for either timeout or wake-up signal
                    await this.waitForNoWalletWakeUpOrTimeout(1000);
                }
            } catch (error) {
                log.error('Error in no-wallet processing loop', {
                    error: (error as Error).message,
                });

                // Wait before retrying (shorter timeout for errors)
                await this.waitForNoWalletWakeUpOrTimeout(5000);
            }
        }

        // Clean up wake-up resolver
        this.noWalletWakeUpResolver = undefined;
        log.debug('No-wallet processing loop ended');
    }

    /**
     * Trigger processing for all active wallets
     */
    private triggerProcessingForAllWallets(): void {
        // Get all wallet addresses from active processing loops
        for (const [walletAddress, isActive] of this.processingLoops.entries()) {
            if (isActive) {
                // Wake up the processing loop immediately
                const wakeUpResolver = this.wakeUpResolvers.get(walletAddress);
                if (wakeUpResolver) {
                    log.debug('Waking up processing loop for wallet', { walletAddress });
                    wakeUpResolver();
                } else {
                    log.debug('No wake-up resolver found for wallet', { walletAddress });
                }
            }
        }
    }

    /**
     * Trigger processing for no-wallet events
     */
    private triggerNoWalletProcessing(): void {
        if (this.noWalletProcessing && this.noWalletWakeUpResolver) {
            log.debug('Waking up no-wallet processing loop');
            this.noWalletWakeUpResolver();
        }
    }

    /**
     * Wait for either a wake-up signal or timeout
     */
    private async waitForWakeUpOrTimeout(walletAddress: string, timeoutMs: number): Promise<void> {
        return new Promise<void>((resolve) => {
            // Set up timeout
            const timeoutId = setTimeout(() => {
                // Clean up wake-up resolver and resolve
                this.wakeUpResolvers.delete(walletAddress);
                resolve();
            }, timeoutMs);

            // Set up wake-up resolver
            const wakeUpResolver = () => {
                clearTimeout(timeoutId);
                this.wakeUpResolvers.delete(walletAddress);
                resolve();
            };

            this.wakeUpResolvers.set(walletAddress, wakeUpResolver);
        });
    }

    /**
     * Wait for either a wake-up signal or timeout for no-wallet processing
     */
    private async waitForNoWalletWakeUpOrTimeout(timeoutMs: number): Promise<void> {
        return new Promise<void>((resolve) => {
            // Set up timeout
            const timeoutId = setTimeout(() => {
                // Clean up wake-up resolver and resolve
                this.noWalletWakeUpResolver = undefined;
                resolve();
            }, timeoutMs);

            // Set up wake-up resolver
            const wakeUpResolver = () => {
                clearTimeout(timeoutId);
                this.noWalletWakeUpResolver = undefined;
                resolve();
            };

            this.noWalletWakeUpResolver = wakeUpResolver;
        });
    }

    /**
     * Get enabled event types based on registered handlers in EventRouter
     */
    private getEnabledEventTypes(): EventType[] {
        return this.eventRouter.getEnabledEventTypes();
    }

    /**
     * Get enabled event types for no-wallet processing (currently only connect)
     */
    private getNoWalletEnabledEventTypes(): EventType[] {
        const enabledTypes = this.eventRouter.getEnabledEventTypes();
        // Currently, only connect events don't require a wallet
        return enabledTypes
            .filter((type) => type === 'connect' || type === 'restoreConnection')
            .concat(['restoreConnection']);
    }
}
