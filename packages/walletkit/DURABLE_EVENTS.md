# Durable Event System Architecture

## Overview

The durable event system ensures bridge events are reliably processed by storing them persistently before processing. This prevents event loss during application crashes, network failures, or processing errors.

## Core Concepts

### Event States
- **new**: Event received from bridge, ready for processing
- **processing**: Event currently being processed by a wallet
- **completed**: Event successfully processed and response sent

### Event Storage
Events are stored with comprehensive metadata including:
- Unique event ID
- Raw bridge event data  
- Processing state
- Timestamps for state changes
- Associated session ID
- Size validation (<100kb)

### Event Processing
Wallets consume events based on:
- Active sessions for that wallet
- Event types the application is listening for
- First-come-first-served with atomic locking

## Architecture Components

### EventStore
Central persistent storage for all bridge events.

**Key Methods:**
- `storeEvent(rawEvent)` - Store new event from bridge
- `getEventsForWallet(walletAddress, eventTypes)` - Get consumable events
- `acquireLock(eventId, walletAddress)` - Atomic event claiming
- `updateEventStatus(eventId, status)` - Update processing state
- `recoverStaleEvents()` - Reset processing events older than 5 minutes

**Storage Schema:**
```typescript
interface StoredEvent {
  id: string;
  sessionId?: string;
  eventType: 'connect' | 'sendTransaction' | 'signData' | 'disconnect';
  rawEvent: RawBridgeEvent;
  status: 'new' | 'processing' | 'completed';
  createdAt: number;
  processingStartedAt?: number;
  completedAt?: number;
  lockedBy?: string; // walletAddress
  sizeBytes: number;
}
```

### EventProcessor
Manages event consumption for wallets.

**Key Methods:**
- `processEvents(wallet, enabledEventTypes)` - Main processing loop
- `getNextEvent(walletAddress, eventTypes)` - Find and lock next event
- `completeEvent(eventId)` - Mark event as completed
- `startRecoveryLoop()` - Background recovery of stale events

**Processing Flow:**
1. Wallet gets list of active sessions
2. Determine which event types are enabled (based on registered handlers)
3. Query EventStore for new events matching sessions + event types
4. Attempt to acquire lock on first available event
5. Process event through existing EventRouter/Handler system
6. Mark event as completed after successful response

### Bridge Integration
BridgeManager stores events before routing.

**Updated Flow:**
1. Bridge receives event
2. Validate event size (<100kb)
3. Store event in EventStore with 'new' status
4. Emit 'bridge-storage-updated' event
5. EventProcessor listens for this event and triggers processing

### Recovery Mechanism
Background process prevents stuck events.

**Recovery Logic:**
- Every 60 seconds, scan for events with status='processing'
- If `processingStartedAt` > 5 minutes ago, reset to status='new'
- Clear `lockedBy` and `processingStartedAt` fields
- Emit 'bridge-storage-updated' to trigger reprocessing

## Event Flow

```
Bridge Event
    ↓
BridgeManager (validate size)
    ↓
EventStore.storeEvent() → status='new'
    ↓
Emit 'bridge-storage-updated'
    ↓
EventProcessor (for each wallet)
    ↓
Query events for wallet sessions + enabled types
    ↓
EventStore.acquireLock() → status='processing'
    ↓
EventRouter.routeEvent() (existing logic)
    ↓
Handler processing + response
    ↓
EventStore.updateEventStatus() → status='completed'
```

## Session-Based Filtering

Events are filtered by:
1. **Session matching**: Event's sessionId must match wallet's active sessions
2. **Event type filtering**: Only process events for which handlers are registered
3. **Wallet ownership**: Events locked by specific wallet address

## Concurrency & Locking

- **Atomic locking**: `acquireLock()` uses atomic operations to prevent race conditions
- **Single ownership**: Each event can only be processed by one wallet at a time
- **Lock timeout**: Processing locks automatically expire after 5 minutes
- **Recovery safe**: Recovery process safely handles partially processed events

## Storage Considerations

- **Cleanup**: Completed events older than 7 days are automatically purged
- **Size limits**: Events >100kb are rejected at storage time
- **Performance**: Events indexed by status, sessionId, and walletAddress
- **Durability**: All state changes are immediately persisted

## Error Handling

- **Storage failures**: Events lost if storage fails (logged but not retried)
- **Processing errors**: Events remain in 'processing' state until recovery
- **Lock conflicts**: Multiple wallets attempting to lock same event are handled gracefully
- **Invalid events**: Malformed events are rejected at validation stage

## Backwards Compatibility

- Existing EventRouter and Handler interfaces remain unchanged
- EventProcessor wraps existing event routing logic
- Applications can opt-in to durable events via configuration
- Non-durable mode still supported for testing/development

## Configuration

```typescript
interface DurableEventsConfig {
  enabled: boolean;
  recoveryIntervalMs: number; // default: 60000
  processingTimeoutMs: number; // default: 300000 (5 min)
  cleanupIntervalMs: number; // default: 86400000 (24 hours)
  retentionDays: number; // default: 7
}
```