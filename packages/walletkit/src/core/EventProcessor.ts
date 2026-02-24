/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Event processor for wallet-based event consumption

import type {
    EventProcessor as IEventProcessor,
    EventStore,
    DurableEventsConfig,
    StoredEvent,
} from '../types/durableEvents';
import type { EventType } from '../types/internal';
import type { WalletManager } from './WalletManager';
import type { TONConnectSessionManager } from '../api/interfaces/TONConnectSessionManager';
import type { EventRouter } from './EventRouter';
import type { EventEmitter } from './EventEmitter';
import { globalLogger } from './Logger';
import type { WalletId } from '../utils/walletId';

const log = globalLogger.createChild('EventProcessor');

export interface EventProcessorConfig {
    disableEvents?: boolean;
    disableTransactionEmulation?: boolean; // if true, transaction events will not be emulated before firing
}

/**
 * Processes durable events for wallets based on their active sessions and enabled event types
 */
export class StorageEventProcessor implements IEventProcessor {
    private eventStore: EventStore;
    private config: DurableEventsConfig;
    private sessionManager: TONConnectSessionManager;
    private eventRouter: EventRouter;
    private eventEmitter: EventEmitter;
    private walletManager: WalletManager;

    // Single global processing loop state
    private isProcessing: boolean = false;
    private wakeUpResolver?: () => void;

    // Track which wallets are registered for processing
    private registeredWallets: Set<WalletId> = new Set();

    // Recovery and cleanup timeouts
    private recoveryTimeoutId?: number;
    private cleanupTimeoutId?: number;

    private processorConfig: EventProcessorConfig;

    constructor(
        processorConfig: EventProcessorConfig = {},
        eventStore: EventStore,
        config: DurableEventsConfig,
        walletManager: WalletManager,
        sessionManager: TONConnectSessionManager,
        eventRouter: EventRouter,
        eventEmitter: EventEmitter,
    ) {
        this.processorConfig = processorConfig;

        this.eventStore = eventStore;
        this.config = config;
        this.sessionManager = sessionManager;
        this.eventRouter = eventRouter;
        this.eventEmitter = eventEmitter;
        this.walletManager = walletManager;

        if (this.processorConfig.disableEvents) {
            return;
        }

        // Listen for bridge storage updates to trigger processing
        this.eventEmitter.on('bridge-storage-updated', () => {
            this.triggerProcessing();
        });
    }

    /**
     * Start processing events for a wallet
     */
    async startProcessing(walletId?: string): Promise<void> {
        if (this.processorConfig.disableEvents) {
            return;
        }

        if (walletId) {
            if (this.registeredWallets.has(walletId)) {
                log.debug('Processing already registered for wallet', { walletId });
            } else {
                this.registeredWallets.add(walletId);
                log.info('Registered wallet for event processing', { walletId });
            }
        }

        // Start global processing loop if not already running
        if (!this.isProcessing) {
            this.isProcessing = true;
            log.info('Started global event processing loop');
            this.processEventsLoop();
        } else {
            // Wake up existing loop to process new wallet's events
            this.triggerProcessing();
        }
    }

    /**
     * Stop processing events for a wallet
     */
    async stopProcessing(walletId?: WalletId): Promise<void> {
        if (this.processorConfig.disableEvents) {
            return;
        }

        if (walletId) {
            this.registeredWallets.delete(walletId);
            log.info('Unregistered wallet from event processing', { walletId });
        }

        // If no more wallets registered, stop the global loop
        if (this.registeredWallets.size === 0 && this.isProcessing && !walletId) {
            this.isProcessing = false;
            if (this.wakeUpResolver) {
                this.wakeUpResolver();
                this.wakeUpResolver = undefined;
            }
            log.info('Stopped global event processing loop (no more wallets)');
        }
    }

    async clearRegisteredWallets(): Promise<void> {
        this.registeredWallets.clear();
        log.info('Cleared registered wallets from event processing');
    }

    /**
     * Process next available event from any source (wallet or no-wallet)
     * This is the main method used by the global processing loop
     */
    private async processNextAvailableEvent(): Promise<boolean> {
        try {
            // Get all active sessions for registered wallets
            const allLocalSessions = await this.sessionManager.getSessions();

            const allSessions = allLocalSessions.filter(
                (session) => session.walletId && this.registeredWallets.has(session.walletId),
            );

            // Get enabled event types
            const enabledEventTypes = this.getEnabledEventTypes();

            // Get all events (both wallet and no-wallet events)
            const allEvents: StoredEvent[] = [];

            // Get wallet events if we have active sessions
            if (allSessions.length > 0) {
                // Get wallet addresses for all sessions
                const walletIds = Array.from(new Set(allSessions.map((s) => s.walletId).filter(Boolean)));

                // Get events for all wallets
                for (const walletId of walletIds) {
                    const walletSessionIds = allSessions.filter((s) => s.walletId === walletId).map((s) => s.sessionId);
                    const events = await this.eventStore.getEventsForWallet(walletSessionIds, enabledEventTypes);
                    allEvents.push(...events);
                }
            }

            // Get no-wallet events if enabled
            const noWalletEventTypes = this.getNoWalletEnabledEventTypes();
            if (noWalletEventTypes.length > 0) {
                const noWalletEvents = await this.eventStore.getNoWalletEvents(noWalletEventTypes);
                allEvents.push(...noWalletEvents);
            }

            // Sort all events by creation time (oldest first)
            allEvents.sort((a, b) => a.createdAt - b.createdAt);

            if (allEvents.length === 0) {
                return false; // No events to process
            }

            // Try to acquire lock on the first (oldest) event
            const eventToUse = allEvents[0];
            const walletId = allSessions.find((s) => s.sessionId === eventToUse.sessionId)?.walletId || 'no-wallet';

            // Process the event
            const processed = await this.processEvent(eventToUse, walletId);
            return processed;
        } catch (error) {
            log.error('Error in processNextAvailableEvent', {
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
                    // Trigger global processing since we recovered events
                    this.triggerProcessing();
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
     * Process a single event with retry logic
     * Returns true if event was processed successfully, false otherwise
     */
    private async processEvent(event: StoredEvent, walletId: WalletId): Promise<boolean> {
        const acquiredEvent = await this.eventStore.acquireLock(event.id, walletId);

        if (!acquiredEvent) {
            log.debug('Failed to acquire lock on event', { eventId: event.id, walletId });
            return false;
        }

        const retryCount = event.retryCount || 0;

        // Check if event has exceeded max retries
        if (retryCount >= this.config.maxRetries) {
            log.error('Event exceeded max retries, marking as errored', {
                eventId: event.id,
                retryCount,
                maxRetries: this.config.maxRetries,
            });

            try {
                await this.eventStore.updateEventStatus(event.id, 'errored', 'processing');
            } catch (error) {
                log.error('Failed to mark event as errored', {
                    eventId: event.id,
                    error: (error as Error).message,
                });
            }
            return false;
        }

        log.info('Processing event', {
            eventId: event.id,
            eventType: event.eventType,
            walletId,
            sessionId: event.sessionId,
            retryCount,
        });

        // Process the event through EventRouter
        try {
            let wallet;
            let walletAddress;
            if (walletId) {
                wallet = this.walletManager.getWallet(walletId);
                walletAddress = await wallet?.getAddress();
            }
            await this.eventRouter.routeEvent({
                ...event.rawEvent,
                ...(walletId ? { walletId } : {}),
                ...(walletAddress ? { walletAddress } : {}),
            });

            // Mark as completed
            await this.eventStore.updateEventStatus(event.id, 'completed', 'processing');

            log.info('Event processing completed', { eventId: event.id });
            return true;
        } catch (error) {
            const errorMessage = (error as Error).message ?? 'Unknown error';
            log.error('Error processing event', {
                eventId: event.id,
                error: errorMessage,
                retryCount,
            });

            // Release lock on event and increment retry count if error is provided
            try {
                await this.eventStore.releaseLock(event.id, errorMessage);
            } catch (updateError) {
                log.error('Failed to increment retry count', {
                    eventId: event.id,
                    error: (updateError as Error).message,
                });
            }

            return false;
        }
    }

    /**
     * Main global processing loop for all events
     */
    private async processEventsLoop(): Promise<void> {
        while (this.isProcessing) {
            try {
                const processed = await this.processNextAvailableEvent();

                if (!processed) {
                    // No events processed, wait for either timeout or wake-up signal
                    await this.waitForWakeUpOrTimeout(500);
                }
            } catch (error) {
                log.error('Error in global processing loop', {
                    error: (error as Error).message,
                });

                // Wait before retrying (shorter timeout for errors)
                await this.waitForWakeUpOrTimeout(500);
            }
        }

        // Clean up wake-up resolver
        this.wakeUpResolver = undefined;
        log.debug('Global processing loop ended');
    }

    /**
     * Trigger the global processing loop
     */
    private triggerProcessing(): void {
        if (this.isProcessing && this.wakeUpResolver) {
            log.debug('Waking up global processing loop');
            this.wakeUpResolver();
        }
    }

    /**
     * Wait for either a wake-up signal or timeout
     */
    private async waitForWakeUpOrTimeout(timeoutMs: number): Promise<void> {
        return new Promise<void>((resolve) => {
            // Set up timeout
            const timeoutId = setTimeout(() => {
                // Clean up wake-up resolver and resolve
                this.wakeUpResolver = undefined;
                resolve();
            }, timeoutMs);

            // Set up wake-up resolver
            const wakeUpResolver = () => {
                clearTimeout(timeoutId);
                this.wakeUpResolver = undefined;
                resolve();
            };

            this.wakeUpResolver = wakeUpResolver;
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
        return enabledTypes.filter((type) => type === 'connect' || type === 'restoreConnection');
    }
}
