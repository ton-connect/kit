/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Durable event system types

import { WalletId } from '../utils/walletId';
import type { RawBridgeEvent, EventType } from './internal';

/**
 * Event processing states
 */
export type EventStatus = 'new' | 'processing' | 'completed' | 'errored';

/**
 * Stored event with metadata
 */
export interface StoredEvent {
    /** Unique event identifier */
    id: string;

    /** Session ID associated with the event */
    sessionId?: string;

    /** Type of bridge event */
    eventType: EventType;

    /** Original raw bridge event data */
    rawEvent: RawBridgeEvent;

    /** Current processing status */
    status: EventStatus;

    /** Timestamp when event was received (Unix timestamp) */
    createdAt: number;

    /** Timestamp when processing started (Unix timestamp) */
    processingStartedAt?: number;

    /** Timestamp when processing completed (Unix timestamp) */
    completedAt?: number;

    /** Wallet address that has locked this event for processing */
    lockedBy?: string;

    /** Size of the event in bytes */
    sizeBytes: number;

    /** Number of retry attempts made for this event */
    retryCount?: number;

    /** Last error message encountered during processing */
    lastError?: string;
}

/**
 * Configuration for durable events
 */
export interface DurableEventsConfig {
    /** Interval for loop in milliseconds */
    recoveryIntervalMs: number;

    /** Timeout after which event is considered stale and will be recovered */
    processingTimeoutMs: number;

    /** Interval for cleanup process in milliseconds */
    cleanupIntervalMs: number;

    /** How long to retain events in milliseconds */
    retentionMs: number;

    /** Delay between retry attempts in milliseconds */
    retryDelayMs: number;

    /** Maximum number of retry attempts before marking event as errored */
    maxRetries: number;
}

/**
 * Default configuration for durable events
 */
export const DEFAULT_DURABLE_EVENTS_CONFIG: DurableEventsConfig = {
    recoveryIntervalMs: 10 * 1000, // 10 seconds
    processingTimeoutMs: 60 * 1000, // 1 minute
    cleanupIntervalMs: 60 * 1000, // 1 minute
    retentionMs: 60 * 10 * 1000, // 10 minutes
    retryDelayMs: 500, // 500 milliseconds
    maxRetries: 20, // 20 retry attempts
};

/**
 * Event store interface for persistent storage of bridge events
 */
export interface EventStore {
    /**
     * Store a new event from the bridge
     */
    storeEvent(rawEvent: RawBridgeEvent): Promise<StoredEvent>;

    /**
     * Get events for a wallet that are ready for processing
     */
    getEventsForWallet(sessionIds: string[], eventTypes: EventType[]): Promise<StoredEvent[]>;

    /**
     * Get events that don't require a wallet or session (e.g., connect events)
     */
    getNoWalletEvents(eventTypes: EventType[]): Promise<StoredEvent[]>;

    /**
     * Attempt to acquire exclusive lock on an event for processing
     * Returns true if lock acquired, false if already locked
     */
    acquireLock(eventId: string, walletId: WalletId): Promise<StoredEvent | undefined>;

    /**
     * Release lock on an event and increment retry count if error is provided
     */
    releaseLock(eventId: string, error?: string): Promise<StoredEvent>;

    /**
     * Update event status and timestamps with optimistic locking
     */
    updateEventStatus(eventId: string, status: EventStatus, oldStatus: EventStatus): Promise<StoredEvent>;

    /**
     * Get event by ID
     */
    getEvent(eventId: string): Promise<StoredEvent | null>;

    /**
     * Recover stale events that have been processing too long
     * Returns number of events recovered
     */
    recoverStaleEvents(processingTimeoutMs: number): Promise<number>;

    /**
     * Clean up old completed events
     * Returns number of events cleaned up
     */
    cleanupOldEvents(retentionMs: number): Promise<number>;

    /**
     * Get all events (for debugging)
     */
    getAllEvents(): Promise<StoredEvent[]>;
}

/**
 * Event processor interface for consuming durable events
 */
export interface EventProcessor {
    /**
     * Start processing events for a wallet
     */
    startProcessing(walletAddress: string): Promise<void>;

    /**
     * Stop processing events for a wallet
     */
    stopProcessing(walletAddress: string): Promise<void>;

    /**
     * Mark an event as completed after successful processing
     */
    completeEvent(eventId: string): Promise<void>;

    /**
     * Start the recovery process for stale events
     */
    startRecoveryLoop(): void;

    /**
     * Stop the recovery process
     */
    stopRecoveryLoop(): void;
}
