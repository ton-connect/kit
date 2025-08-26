// Event processor for wallet-based event consumption

import type { EventProcessor as IEventProcessor, EventStore, DurableEventsConfig } from '../types/durableEvents';
import type { EventType } from '../types/internal';
import type { WalletManager } from './WalletManager';
import type { SessionManager } from './SessionManager';
import type { EventRouter } from './EventRouter';
import type { EventEmitter } from './EventEmitter';
import { globalLogger } from './Logger';
import { delay } from '../utils/delay';

const log = globalLogger.createChild('EventProcessor');

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

    // Recovery and cleanup timeouts
    private recoveryTimeoutId?: number;
    private cleanupTimeoutId?: number;

    constructor(
        eventStore: EventStore,
        config: DurableEventsConfig,
        walletManager: WalletManager,
        sessionManager: SessionManager,
        eventRouter: EventRouter,
        eventEmitter: EventEmitter,
    ) {
        this.eventStore = eventStore;
        this.config = config;
        this.walletManager = walletManager;
        this.sessionManager = sessionManager;
        this.eventRouter = eventRouter;
        this.eventEmitter = eventEmitter;

        // Listen for bridge storage updates to trigger processing
        this.eventEmitter.on('bridge-storage-updated', () => {
            this.triggerProcessingForAllWallets();
        });
    }

    /**
     * Start processing events for a wallet
     */
    async startProcessing(walletAddress: string, enabledEventTypes: EventType[]): Promise<void> {
        // debugger;

        if (this.processingLoops.get(walletAddress)) {
            log.debug('Processing already active for wallet', { walletAddress });
            return;
        }

        this.processingLoops.set(walletAddress, true);
        log.info('Started event processing for wallet', { walletAddress, enabledEventTypes });

        // Start processing loop
        this.processEventsLoop(walletAddress, enabledEventTypes);
    }

    /**
     * Stop processing events for a wallet
     */
    async stopProcessing(walletAddress: string): Promise<void> {
        this.processingLoops.set(walletAddress, false);
        log.info('Stopped event processing for wallet', { walletAddress });
    }

    /**
     * Process next available event for a wallet
     */
    async processNextEvent(walletAddress: string, enabledEventTypes: EventType[]): Promise<boolean> {
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
                    wallet: this.walletManager.getWallet(walletAddress),
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
    private async processEventsLoop(walletAddress: string, enabledEventTypes: EventType[]): Promise<void> {
        while (this.processingLoops.get(walletAddress)) {
            try {
                const processed = await this.processNextEvent(walletAddress, enabledEventTypes);

                if (!processed) {
                    // No events processed, wait a bit before checking again
                    await delay(1000);
                }
            } catch (error) {
                log.error('Error in processing loop', {
                    walletAddress,
                    error: (error as Error).message,
                });

                // Wait before retrying
                await delay(5000);
            }
        }

        log.debug('Processing loop ended for wallet', { walletAddress });
    }

    /**
     * Trigger processing for all active wallets
     * TODO - implement this
     */
    private triggerProcessingForAllWallets(): void {
        // Get all wallet addresses from active processing loops
        for (const [walletAddress, isActive] of this.processingLoops.entries()) {
            if (isActive) {
                // Emit an event to wake up the processing loop
                // The loop will check for new events on next iteration
                log.debug('Triggering processing for wallet', { walletAddress });
            }
        }
    }

    /**
     * Get enabled event types based on registered handlers in EventRouter
     */
    // private getEnabledEventTypes(): EventType[] {
    //     return this.eventRouter.getEnabledEventTypes();
    // }

    // private delay(ms: number): Promise<void> {
    //     return new Promise((resolve) => setTimeout(resolve, ms));
    // }
}
