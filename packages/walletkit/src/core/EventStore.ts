/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Durable event storage implementation

import type { StoredEvent, EventStore, EventStatus } from '../types/durableEvents';
import type { RawBridgeEvent, EventType } from '../types/internal';
import { Storage } from '../storage';
import { globalLogger } from './Logger';
import { validateBridgeEvent } from '../validation/events';

const getEventUUID = () => {
    return crypto.randomUUID();
};

const log = globalLogger.createChild('EventStore');

const MAX_EVENT_SIZE_BYTES = 100 * 1024; // 100kb

/**
 * Concrete implementation of EventStore using Storage
 */
export class StorageEventStore implements EventStore {
    private storage: Storage;
    private storageKey = 'durable_events';
    private operationLock = new Map<string, Promise<void>>();

    constructor(storage: Storage) {
        this.storage = storage;
    }

    /**
     * Store a new event from the bridge
     */
    async storeEvent(_rawEvent: RawBridgeEvent): Promise<StoredEvent> {
        const rawEvent = { ..._rawEvent, wallet: undefined };
        // Validate event structure
        const validation = validateBridgeEvent(rawEvent);
        if (!validation.isValid) {
            throw new Error(`Invalid bridge event: ${validation.errors.join(', ')}`);
        }

        // Check event size
        const eventStr = JSON.stringify(rawEvent);
        const sizeBytes = new TextEncoder().encode(eventStr).length;

        if (sizeBytes > MAX_EVENT_SIZE_BYTES) {
            throw new Error(`Event too large: ${sizeBytes} bytes (max: ${MAX_EVENT_SIZE_BYTES})`);
        }

        // Extract event type from method
        const eventType = this.extractEventType(rawEvent.method);

        // Create stored event
        const storedEvent: StoredEvent = {
            id: getEventUUID(),
            sessionId: rawEvent.from,
            eventType,
            rawEvent,
            status: 'new',
            createdAt: Date.now(),
            sizeBytes,
        };

        // Store event
        await this.saveEvent(storedEvent);

        log.info('Event stored', {
            eventId: storedEvent.id,
            eventType,
            sizeBytes,
            sessionId: rawEvent.from,
        });

        return storedEvent;
    }

    /**
     * Get events for a wallet that are ready for processing
     */
    async getEventsForWallet(sessionIds: string[], eventTypes: EventType[]): Promise<StoredEvent[]> {
        const events = await this.getAllEvents();

        return events
            .filter(
                (event) =>
                    // Only new events
                    event.status === 'new' &&
                    // Must match one of the session IDs
                    event.sessionId &&
                    sessionIds.includes(event.sessionId) &&
                    // Must be one of the requested event types
                    eventTypes.includes(event.eventType),
            )
            .sort((a, b) => a.createdAt - b.createdAt); // Oldest first
    }

    /**
     * Get events that don't require a wallet or session (e.g., connect events)
     */
    async getNoWalletEvents(eventTypes: EventType[]): Promise<StoredEvent[]> {
        const events = await this.getAllEvents();

        return events
            .filter(
                (event) =>
                    // Only new events
                    event.status === 'new' &&
                    // Must be one of the requested event types
                    eventTypes.includes(event.eventType),
            )
            .sort((a, b) => a.createdAt - b.createdAt); // Oldest first
    }

    /**
     * Attempt to acquire exclusive lock on an event for processing
     */
    async acquireLock(eventId: string, walletAddress: string): Promise<StoredEvent | undefined> {
        return this.withLock('storage', async () => {
            const allEvents = await this.getAllEventsFromStorage();
            const event = allEvents[eventId];
            if (!event) {
                log.warn('Cannot lock non-existent event', { eventId });
                return undefined;
            }

            if (event.status !== 'new') {
                log.debug('Cannot lock event - not in new status', {
                    eventId,
                    status: event.status,
                    lockedBy: event.lockedBy,
                });
                return undefined;
            }

            // Update event to processing status with lock
            const updatedEvent: StoredEvent = {
                ...event,
                status: 'processing',
                processingStartedAt: Date.now(),
                lockedBy: walletAddress,
            };

            // Save atomically within the lock
            allEvents[eventId] = updatedEvent;
            await this.storage.set(this.storageKey, allEvents);

            log.debug('Event lock acquired', { eventId, walletAddress });
            return updatedEvent;
        });
    }

    /**
     * Increment retry count and update error message for an event
     */
    async releaseLock(eventId: string, error?: string): Promise<StoredEvent> {
        return this.withLock('storage', async () => {
            const allEvents = await this.getAllEventsFromStorage();
            const event = allEvents[eventId];

            if (!event) {
                throw new Error(`Event not found: ${eventId}`);
            }

            if (event.status !== 'processing') {
                throw new Error(`Event not in processing status: ${eventId}, current status: ${event.status}`);
            }

            const addRetryCount = error ? 1 : 0;

            const updatedEvent: StoredEvent = {
                ...event,
                retryCount: (event.retryCount || 0) + addRetryCount,
                lastError: error,
                status: 'new',
                lockedBy: undefined,
                processingStartedAt: undefined,
            };

            // Save atomically within the lock
            allEvents[eventId] = updatedEvent;
            await this.storage.set(this.storageKey, allEvents);

            log.debug('Event retry count incremented', {
                eventId,
                retryCount: updatedEvent.retryCount,
                error,
            });

            return updatedEvent;
        });
    }

    /**
     * Update event status and timestamps with optimistic locking
     */
    async updateEventStatus(eventId: string, status: EventStatus, oldStatus: EventStatus): Promise<StoredEvent> {
        return this.withLock('storage', async () => {
            const allEvents = await this.getAllEventsFromStorage();
            const event = allEvents[eventId];

            if (!event) {
                throw new Error(`Event not found: ${eventId}`);
            }

            if (event.status !== oldStatus) {
                throw new Error(
                    `Event status mismatch: expected '${oldStatus}', but current status is '${event.status}'`,
                );
            }

            const updatedEvent: StoredEvent = {
                ...event,
                status,
            };

            if (status === 'completed') {
                updatedEvent.completedAt = Date.now();
            }

            // Save atomically within the lock
            allEvents[eventId] = updatedEvent;
            await this.storage.set(this.storageKey, allEvents);

            log.debug('Event status updated', { eventId, oldStatus, newStatus: status });

            return updatedEvent;
        });
    }

    /**
     * Get event by ID
     */
    async getEvent(eventId: string): Promise<StoredEvent | null> {
        try {
            const allEvents = await this.getAllEventsFromStorage();
            return allEvents[eventId] || null;
        } catch (error) {
            log.warn('Failed to get event', { eventId, error });
            return null;
        }
    }

    /**
     * Recover stale events that have been processing too long
     */
    async recoverStaleEvents(processingTimeoutMs: number): Promise<number> {
        const events = await this.getAllEvents();
        const now = Date.now();
        let recoveredCount = 0;

        for (const event of events) {
            if (
                event.status === 'processing' &&
                event.processingStartedAt &&
                now - event.processingStartedAt > processingTimeoutMs
            ) {
                // Reset to processing status (keep retry count) so it can be retried
                const recoveredEvent: StoredEvent = {
                    ...event,
                    processingStartedAt: undefined,
                    lockedBy: undefined,
                };

                await this.saveEvent(recoveredEvent);
                recoveredCount++;

                log.info('Recovered stale event', {
                    eventId: event.id,
                    lockedBy: event.lockedBy,
                    staleMinutes: Math.round((now - event.processingStartedAt) / 60000),
                    retryCount: event.retryCount || 0,
                });
            }
        }

        if (recoveredCount > 0) {
            log.info('Event recovery completed', { recoveredCount });
        }

        return recoveredCount;
    }

    /**
     * Clean up old completed events
     */
    async cleanupOldEvents(retentionMs: number): Promise<number> {
        const events = await this.getAllEvents();
        const cutoffTime = Date.now() - retentionMs;
        let cleanedUpCount = 0;
        const eventsToRemove: string[] = [];

        for (const event of events) {
            // Clean up completed events and errored events
            if (
                (event.status === 'completed' && event.completedAt && event.completedAt < cutoffTime) ||
                (event.status === 'errored' && event.createdAt < cutoffTime)
            ) {
                eventsToRemove.push(event.id);
                log.debug('Marked event for cleanup', { eventId: event.id, status: event.status });
            }
        }

        // Remove all old events in a single atomic operation
        if (eventsToRemove.length > 0) {
            await this.withLock('storage', async () => {
                const allEvents = await this.getAllEventsFromStorage();
                for (const eventId of eventsToRemove) {
                    delete allEvents[eventId];
                    cleanedUpCount++;
                }
                await this.storage.set(this.storageKey, allEvents);
            });
            log.info('Event cleanup completed', { cleanedUpCount });
        }

        return cleanedUpCount;
    }

    /**
     * Get all events (for debugging and internal operations)
     */
    async getAllEvents(): Promise<StoredEvent[]> {
        try {
            const allEvents = await this.getAllEventsFromStorage();
            return Object.values(allEvents);
        } catch (error) {
            log.warn('Failed to get all events', { error });
            return [];
        }
    }

    // Private helper methods

    private async withLock<T>(lockKey: string, operation: () => Promise<T>): Promise<T> {
        // Wait for any existing operation to complete
        const existingLock = this.operationLock.get(lockKey);
        if (existingLock) {
            await existingLock;
        }

        // Create and store new operation promise
        const operationPromise = operation();
        this.operationLock.set(
            lockKey,
            operationPromise.then(
                () => {},
                () => {},
            ),
        ); // Convert to void promise

        try {
            const result = await operationPromise;
            this.operationLock.delete(lockKey);
            return result;
        } catch (error) {
            this.operationLock.delete(lockKey);
            throw error;
        }
    }

    private async getAllEventsFromStorage(): Promise<Record<string, StoredEvent>> {
        try {
            const eventsData = await this.storage.get<Record<string, StoredEvent>>(this.storageKey);
            return eventsData || {};
        } catch (error) {
            log.warn('Failed to get events from storage', { error });
            return {};
        }
    }

    private async saveEvent(event: StoredEvent): Promise<void> {
        return this.withLock('storage', async () => {
            const allEvents = await this.getAllEventsFromStorage();
            allEvents[event.id] = event;
            await this.storage.set(this.storageKey, allEvents);
        });
    }

    private async removeEvent(eventId: string): Promise<void> {
        return this.withLock('storage', async () => {
            const allEvents = await this.getAllEventsFromStorage();
            delete allEvents[eventId];
            await this.storage.set(this.storageKey, allEvents);
        });
    }

    private extractEventType(method: string): EventType {
        switch (method) {
            case 'connect':
                return 'connect';
            case 'sendTransaction':
                return 'sendTransaction';
            case 'signData':
                return 'signData';
            case 'disconnect':
                return 'disconnect';
            case 'restoreConnection':
                return 'restoreConnection';
            default:
                throw new Error(`Unknown event method: ${method}`);
        }
    }
}
