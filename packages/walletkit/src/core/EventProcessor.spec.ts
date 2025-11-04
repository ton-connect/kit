/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

import { StorageEventProcessor } from './EventProcessor';
import { StorageEventStore } from './EventStore';
import type { DurableEventsConfig } from '../types/durableEvents';
import type { WalletManager } from './WalletManager';
import type { SessionManager } from './SessionManager';
import type { EventRouter } from './EventRouter';
import type { EventEmitter } from './EventEmitter';
import type { RawBridgeEvent } from '../types/internal';
import { Storage } from '../storage/Storage';
import { MemoryStorageAdapter } from '../storage/adapters/memory';

describe('EventProcessor with Real EventStore', () => {
    let eventStore: StorageEventStore;
    let storage: Storage;
    let walletManager: WalletManager;
    let sessionManager: SessionManager;
    let eventRouter: EventRouter;
    let eventEmitter: EventEmitter;
    let config: DurableEventsConfig;
    let processor: StorageEventProcessor;

    beforeEach(() => {
        // Create real in-memory storage and event store
        const memoryAdapter = new MemoryStorageAdapter();
        storage = new Storage(memoryAdapter);
        eventStore = new StorageEventStore(storage);

        // Mock SessionManager
        sessionManager = {
            getSessionsForAPI: vi.fn().mockReturnValue([
                {
                    sessionId: 'session-1',
                    walletAddress: 'wallet-1',
                    dAppName: 'Test DApp',
                    dAppUrl: 'https://test.com',
                    dAppIconUrl: 'https://test.com/icon.png',
                },
            ]),
        } as unknown as SessionManager;

        // Mock EventRouter
        eventRouter = {
            routeEvent: vi.fn(),
            getEnabledEventTypes: vi.fn().mockReturnValue(['sendTransaction', 'signData']),
        } as unknown as EventRouter;

        // Mock EventEmitter
        eventEmitter = {
            on: vi.fn(),
            emit: vi.fn(),
        } as unknown as EventEmitter;

        // Mock WalletManager
        walletManager = {} as WalletManager;

        // Config with fast retry for testing
        config = {
            recoveryIntervalMs: 10000,
            processingTimeoutMs: 60000,
            cleanupIntervalMs: 60000,
            retentionMs: 600000,
            retryDelayMs: 10,
            maxRetries: 3,
        };

        processor = new StorageEventProcessor(
            { disableEvents: false },
            eventStore,
            config,
            walletManager,
            sessionManager,
            eventRouter,
            eventEmitter,
        );
    });

    afterEach(async () => {
        vi.clearAllMocks();
        // Clean up storage
        await storage.clear();
    });

    describe('Event Processing - Success Cases', () => {
        it('should successfully process a transaction event and mark it as completed', async () => {
            const rawEvent: RawBridgeEvent = {
                id: '1',
                method: 'sendTransaction',
                from: 'session-1',
                params: [''],
            } as RawBridgeEvent;

            // Store event using real store
            const storedEvent = await eventStore.storeEvent(rawEvent);

            // Register wallet for processing
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (processor as any).registeredWallets.add('wallet-1');

            vi.mocked(eventRouter.routeEvent).mockResolvedValue();

            // Process the event
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await (processor as any).processNextAvailableEvent();

            expect(result).toBe(true);
            expect(eventRouter.routeEvent).toHaveBeenCalledWith({
                id: '1',
                method: 'sendTransaction',
                from: 'session-1',
                params: [''],
                walletAddress: 'wallet-1',
            });

            // Verify event was marked as completed in store
            const event = await eventStore.getEvent(storedEvent.id);
            expect(event?.status).toBe('completed');
            expect(event?.completedAt).toBeDefined();
        });

        it('should successfully process a signData event', async () => {
            const rawEvent: RawBridgeEvent = {
                id: '2',
                method: 'signData',
                from: 'session-1',
                params: ['sample-data-to-sign'],
            } as RawBridgeEvent;

            const storedEvent = await eventStore.storeEvent(rawEvent);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (processor as any).registeredWallets.add('wallet-1');

            vi.mocked(eventRouter.routeEvent).mockResolvedValue();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await (processor as any).processNextAvailableEvent();

            expect(result).toBe(true);
            expect(eventRouter.routeEvent).toHaveBeenCalledWith({
                id: '2',
                method: 'signData',
                from: 'session-1',
                params: ['sample-data-to-sign'],
                walletAddress: 'wallet-1',
            });

            const event = await eventStore.getEvent(storedEvent.id);
            expect(event?.status).toBe('completed');
        });

        it('should process multiple events in sequence', async () => {
            const event1: RawBridgeEvent = {
                id: '3',
                method: 'sendTransaction',
                from: 'session-1',
                params: ['dest1'],
            } as RawBridgeEvent;

            const event2: RawBridgeEvent = {
                id: '4',
                method: 'sendTransaction',
                from: 'session-1',
                params: ['dest2'],
            } as RawBridgeEvent;

            await eventStore.storeEvent(event1);
            await eventStore.storeEvent(event2);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (processor as any).registeredWallets.add('wallet-1');

            vi.mocked(eventRouter.routeEvent).mockResolvedValue();

            // Process first event
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result1 = await (processor as any).processNextAvailableEvent();
            expect(result1).toBe(true);

            // Process second event
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result2 = await (processor as any).processNextAvailableEvent();
            expect(result2).toBe(true);

            // Verify both events processed
            expect(eventRouter.routeEvent).toHaveBeenCalledTimes(2);

            // Verify no more events to process
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result3 = await (processor as any).processNextAvailableEvent();
            expect(result3).toBe(false);
        });
    });

    describe('Event Processing - Retry Mechanism', () => {
        it('should increment retry count when event processing fails', async () => {
            const rawEvent: RawBridgeEvent = {
                id: '5',
                method: 'sendTransaction',
                from: 'session-1',
            } as RawBridgeEvent;

            const storedEvent = await eventStore.storeEvent(rawEvent);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (processor as any).registeredWallets.add('wallet-1');

            vi.mocked(eventRouter.routeEvent).mockRejectedValue(new Error('Network timeout'));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await (processor as any).processNextAvailableEvent();

            expect(result).toBe(false);

            // Verify retry count was incremented
            const event = await eventStore.getEvent(storedEvent.id);
            expect(event?.retryCount).toBe(1);
            expect(event?.lastError).toBe('Network timeout');
            expect(event?.status).toBe('new'); // Should be back to 'new' for retry
        });

        it('should mark event as errored when retry count exceeds maximum', async () => {
            const rawEvent: RawBridgeEvent = {
                id: '6',
                method: 'sendTransaction',
                from: 'session-1',
            } as RawBridgeEvent;

            const storedEvent = await eventStore.storeEvent(rawEvent);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (processor as any).registeredWallets.add('wallet-1');

            vi.mocked(eventRouter.routeEvent).mockRejectedValue(new Error('Persistent failure'));

            // Retry multiple times until max retries exceeded
            for (let i = 0; i < config.maxRetries; i++) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                await (processor as any).processNextAvailableEvent();
            }

            // Next attempt should mark as errored
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await (processor as any).processNextAvailableEvent();

            expect(result).toBe(false);

            const event = await eventStore.getEvent(storedEvent.id);
            expect(event?.status).toBe('errored');
            expect(event?.retryCount).toBe(config.maxRetries);
        });

        it('should successfully process event after previous failure', async () => {
            const rawEvent: RawBridgeEvent = {
                id: '7',
                method: 'sendTransaction',
                from: 'session-1',
            } as RawBridgeEvent;

            const storedEvent = await eventStore.storeEvent(rawEvent);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (processor as any).registeredWallets.add('wallet-1');

            // First attempt fails
            vi.mocked(eventRouter.routeEvent).mockRejectedValueOnce(new Error('Temporary failure'));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            let result = await (processor as any).processNextAvailableEvent();
            expect(result).toBe(false);

            let event = await eventStore.getEvent(storedEvent.id);
            expect(event?.retryCount).toBe(1);

            // Second attempt succeeds
            vi.mocked(eventRouter.routeEvent).mockResolvedValueOnce();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            result = await (processor as any).processNextAvailableEvent();
            expect(result).toBe(true);

            event = await eventStore.getEvent(storedEvent.id);
            expect(event?.status).toBe('completed');
        });
    });

    describe('No-Wallet Events (Connect/Restore)', () => {
        it('should process connect event without wallet context', async () => {
            const rawEvent: RawBridgeEvent = {
                id: '8',
                method: 'connect',
                from: 'session-new',
            } as RawBridgeEvent;

            await eventStore.storeEvent(rawEvent);

            vi.mocked(eventRouter.getEnabledEventTypes).mockReturnValue(['sendTransaction', 'connect']);
            vi.mocked(eventRouter.routeEvent).mockResolvedValue();

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await (processor as any).processNextAvailableEvent();

            expect(result).toBe(true);
            expect(eventRouter.routeEvent).toHaveBeenCalledWith({
                id: '8',
                method: 'connect',
                from: 'session-new',
                walletAddress: 'no-wallet',
            });
        });

        it('should retry connect event on failure', async () => {
            const rawEvent: RawBridgeEvent = {
                id: '9',
                method: 'connect',
                from: 'session-new',
            } as RawBridgeEvent;

            const storedEvent = await eventStore.storeEvent(rawEvent);

            vi.mocked(eventRouter.getEnabledEventTypes).mockReturnValue(['connect']);
            vi.mocked(eventRouter.routeEvent).mockRejectedValue(new Error('Connection failed'));

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await (processor as any).processNextAvailableEvent();

            expect(result).toBe(false);

            const event = await eventStore.getEvent(storedEvent.id);
            expect(event?.retryCount).toBe(1);
            expect(event?.lastError).toBe('Connection failed');
        });
    });

    describe('Event Ordering - FIFO Processing', () => {
        it('should process older event first even when newer event exists', async () => {
            // Create older event
            const olderEvent: RawBridgeEvent = {
                id: '10',
                method: 'sendTransaction',
                from: 'session-1',
                params: ['old'],
            } as RawBridgeEvent;

            const storedOlder = await eventStore.storeEvent(olderEvent);

            // Wait a bit to ensure timestamp difference
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Create newer event
            const newerEvent: RawBridgeEvent = {
                id: '11',
                method: 'sendTransaction',
                from: 'session-1',
                params: ['new'],
            } as RawBridgeEvent;

            await eventStore.storeEvent(newerEvent);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (processor as any).registeredWallets.add('wallet-1');

            vi.mocked(eventRouter.routeEvent).mockResolvedValue();

            // Process first available event
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (processor as any).processNextAvailableEvent();

            // Should have processed the older event first
            expect(eventRouter.routeEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    params: ['old'],
                }),
            );

            // Verify older event is completed
            const event = await eventStore.getEvent(storedOlder.id);
            expect(event?.status).toBe('completed');
        });

        it('should maintain FIFO order even when earlier event fails', async () => {
            const event1: RawBridgeEvent = {
                id: '12',
                method: 'sendTransaction',
                from: 'session-1',
                params: ['1'],
            } as RawBridgeEvent;

            const event2: RawBridgeEvent = {
                id: '13',
                method: 'sendTransaction',
                from: 'session-1',
                params: ['2'],
            } as RawBridgeEvent;

            await eventStore.storeEvent(event1);
            await new Promise((resolve) => setTimeout(resolve, 10));
            await eventStore.storeEvent(event2);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (processor as any).registeredWallets.add('wallet-1');

            // First event fails
            vi.mocked(eventRouter.routeEvent).mockRejectedValueOnce(new Error('Failed'));
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (processor as any).processNextAvailableEvent();

            // Should retry first event, not skip to second
            vi.mocked(eventRouter.routeEvent).mockClear();
            vi.mocked(eventRouter.routeEvent).mockResolvedValue();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (processor as any).processNextAvailableEvent();

            expect(eventRouter.routeEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    params: ['1'],
                }),
            );
        });
    });

    describe('Multi-Wallet Processing', () => {
        it('should process events from multiple wallets in chronological order', async () => {
            // Set up two wallets
            vi.mocked(sessionManager.getSessionsForAPI).mockReturnValue([
                {
                    sessionId: 'session-1',
                    walletAddress: 'wallet-1',
                    dAppName: 'Test DApp 1',
                    dAppUrl: 'https://test1.com',
                    dAppIconUrl: 'https://test1.com/icon.png',
                },
                {
                    sessionId: 'session-2',
                    walletAddress: 'wallet-2',
                    dAppName: 'Test DApp 2',
                    dAppUrl: 'https://test2.com',
                    dAppIconUrl: 'https://test2.com/icon.png',
                },
            ]);

            // Create older event for wallet-1
            const wallet1Event: RawBridgeEvent = {
                id: '14',
                method: 'sendTransaction',
                from: 'session-1',
                params: ['wallet-1'],
            } as RawBridgeEvent;

            await eventStore.storeEvent(wallet1Event);
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Create newer event for wallet-2
            const wallet2Event: RawBridgeEvent = {
                id: '15',
                method: 'sendTransaction',
                from: 'session-2',
                params: ['wallet-2'],
            } as RawBridgeEvent;

            await eventStore.storeEvent(wallet2Event);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (processor as any).registeredWallets.add('wallet-1');
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (processor as any).registeredWallets.add('wallet-2');

            vi.mocked(eventRouter.routeEvent).mockResolvedValue();

            // Process next event
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (processor as any).processNextAvailableEvent();

            // Should process older event from wallet-1 first
            expect(eventRouter.routeEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    params: ['wallet-1'],
                    walletAddress: 'wallet-1',
                }),
            );

            expect(eventRouter.routeEvent).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    params: ['wallet-2'],
                    walletAddress: 'wallet-2',
                }),
            );

            // Process next event
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (processor as any).processNextAvailableEvent();

            // Should process older event from wallet-1 first
            expect(eventRouter.routeEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    params: ['wallet-2'],
                    walletAddress: 'wallet-2',
                }),
            );
        });

        it('should process no-wallet and wallet events together in chronological order', async () => {
            // Create no-wallet event (older)
            const noWalletEvent: RawBridgeEvent = {
                id: '16',
                method: 'connect',
                from: 'session-new',
            } as RawBridgeEvent;

            await eventStore.storeEvent(noWalletEvent);
            await new Promise((resolve) => setTimeout(resolve, 10));

            // Create wallet event (newer)
            const walletEvent: RawBridgeEvent = {
                id: '17',
                method: 'sendTransaction',
                from: 'session-1',
            } as RawBridgeEvent;

            await eventStore.storeEvent(walletEvent);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (processor as any).registeredWallets.add('wallet-1');

            vi.mocked(eventRouter.getEnabledEventTypes).mockReturnValue(['sendTransaction', 'connect']);
            vi.mocked(eventRouter.routeEvent).mockResolvedValue();

            // Process next event
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (processor as any).processNextAvailableEvent();

            // Should process older no-wallet event first
            expect(eventRouter.routeEvent).toHaveBeenCalledWith({
                id: '16',
                method: 'connect',
                from: 'session-new',
                walletAddress: 'no-wallet',
            });

            expect(eventRouter.routeEvent).not.toHaveBeenCalledWith(
                expect.objectContaining({
                    id: '17',
                }),
            );

            // Process next event
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await (processor as any).processNextAvailableEvent();

            expect(eventRouter.routeEvent).toHaveBeenCalledWith(
                expect.objectContaining({
                    id: '17',
                }),
            );
        });
    });

    describe('Error Handling', () => {
        it('should return false when no events are available for processing', async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (processor as any).registeredWallets.add('wallet-1');

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await (processor as any).processNextAvailableEvent();

            expect(result).toBe(false);
            expect(eventRouter.routeEvent).not.toHaveBeenCalled();
        });

        it('should handle concurrent lock acquisition correctly', async () => {
            const rawEvent: RawBridgeEvent = {
                id: '18',
                method: 'sendTransaction',
                from: 'session-1',
            } as RawBridgeEvent;

            const storedEvent = await eventStore.storeEvent(rawEvent);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (processor as any).registeredWallets.add('wallet-1');

            // Try to acquire lock twice concurrently
            const lock1Promise = eventStore.acquireLock(storedEvent.id, 'wallet-1');
            const lock2Promise = eventStore.acquireLock(storedEvent.id, 'wallet-1');

            const [lock1, lock2] = await Promise.all([lock1Promise, lock2Promise]);

            // Only one should succeed
            expect(lock1).toBeDefined();
            expect(lock2).toBeUndefined(); // Second lock should fail
        });

        it('should handle storage errors gracefully', async () => {
            const rawEvent: RawBridgeEvent = {
                id: '19',
                method: 'sendTransaction',
                from: 'session-1',
            } as RawBridgeEvent;

            await eventStore.storeEvent(rawEvent);

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (processor as any).registeredWallets.add('wallet-1');

            // Make routing fail
            vi.mocked(eventRouter.routeEvent).mockRejectedValue(new Error('Processing error'));

            // Should handle error gracefully
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = await (processor as any).processNextAvailableEvent();

            expect(result).toBe(false);

            // Event should still be available for retry
            const events = await eventStore.getAllEvents();
            const event = events.find((e) => e.sessionId === 'session-1');
            expect(event?.status).toBe('new');
            expect(event?.retryCount).toBe(1);
        });
    });

    describe('Event Recovery and Cleanup', () => {
        it('should recover stale events that have been processing too long', async () => {
            const rawEvent: RawBridgeEvent = {
                id: '20',
                method: 'sendTransaction',
                from: 'session-1',
            } as RawBridgeEvent;

            const storedEvent = await eventStore.storeEvent(rawEvent);

            // Manually acquire lock and simulate stale processing
            await eventStore.acquireLock(storedEvent.id, 'wallet-1');

            // Manually update event to be stale (older than timeout)
            const event = await eventStore.getEvent(storedEvent.id);
            if (event) {
                // Access internal storage directly for testing
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const allEvents = await storage.get<Record<string, any>>('durable_events');
                if (allEvents && allEvents[storedEvent.id]) {
                    allEvents[storedEvent.id].processingStartedAt = Date.now() - config.processingTimeoutMs - 1000;
                    await storage.set('durable_events', allEvents);
                }
            }

            // Recover stale events
            const recoveredCount = await eventStore.recoverStaleEvents(config.processingTimeoutMs);

            expect(recoveredCount).toBe(1);

            // Event should be available for processing again
            const recoveredEvent = await eventStore.getEvent(storedEvent.id);
            expect(recoveredEvent?.processingStartedAt).toBeUndefined();
            expect(recoveredEvent?.lockedBy).toBeUndefined();
        });

        it('should cleanup old completed events', async () => {
            const rawEvent: RawBridgeEvent = {
                id: '21',
                method: 'sendTransaction',
                from: 'session-1',
            } as RawBridgeEvent;

            const storedEvent = await eventStore.storeEvent(rawEvent);

            // Mark as completed
            await eventStore.acquireLock(storedEvent.id, 'wallet-1');
            await eventStore.updateEventStatus(storedEvent.id, 'completed', 'processing');

            // Manually make it old by updating completed timestamp
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const allEvents = await storage.get<Record<string, any>>('durable_events');
            if (allEvents && allEvents[storedEvent.id]) {
                allEvents[storedEvent.id].completedAt = Date.now() - config.retentionMs - 1000;
                await storage.set('durable_events', allEvents);
            }

            // Clean up old events
            const cleanedCount = await eventStore.cleanupOldEvents(config.retentionMs);

            expect(cleanedCount).toBe(1);

            // Event should be removed
            const event = await eventStore.getEvent(storedEvent.id);
            expect(event).toBeNull();
        });
    });
});
