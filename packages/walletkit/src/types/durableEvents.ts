// Durable event system types

import type { RawBridgeEvent, EventType } from './internal';

/**
 * Event processing states
 */
export type EventStatus = 'new' | 'processing' | 'completed';

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
}

/**
 * Configuration for durable events
 */
export interface DurableEventsConfig {
    /** Whether durable events are enabled */
    enabled: boolean;

    /** Interval for recovery process in milliseconds */
    recoveryIntervalMs: number;

    /** Timeout for processing before recovery in milliseconds */
    processingTimeoutMs: number;

    /** Interval for cleanup process in milliseconds */
    cleanupIntervalMs: number;

    /** How long to retain completed events in days */
    retentionDays: number;

    /** Maximum event size in bytes */
    maxEventSizeBytes: number;
}

/**
 * Default configuration for durable events
 */
export const DEFAULT_DURABLE_EVENTS_CONFIG: DurableEventsConfig = {
    enabled: true,
    recoveryIntervalMs: 60000, // 1 minute
    processingTimeoutMs: 300000, // 5 minutes
    cleanupIntervalMs: 86400000, // 24 hours
    retentionDays: 7,
    maxEventSizeBytes: 102400, // 100KB
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
    getEventsForWallet(walletAddress: string, sessionIds: string[], eventTypes: EventType[]): Promise<StoredEvent[]>;

    /**
     * Attempt to acquire exclusive lock on an event for processing
     * Returns true if lock acquired, false if already locked
     */
    acquireLock(eventId: string, walletAddress: string): Promise<StoredEvent | undefined>;

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
    recoverStaleEvents(): Promise<number>;

    /**
     * Clean up old completed events
     * Returns number of events cleaned up
     */
    cleanupOldEvents(): Promise<number>;

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
    startProcessing(walletAddress: string, enabledEventTypes: EventType[]): Promise<void>;

    /**
     * Stop processing events for a wallet
     */
    stopProcessing(walletAddress: string): Promise<void>;

    /**
     * Process next available event for a wallet
     * Returns true if an event was processed, false if none available
     */
    processNextEvent(walletAddress: string, enabledEventTypes: EventType[]): Promise<boolean>;

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
