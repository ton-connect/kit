# Analytics Module

Module for collecting and sending analytics events to TON Analytics API.

## Core Features

- **Event batching** - automatic event grouping for efficient sending
- **Memory leak protection** - event queue limit (MAX_QUEUE_SIZE = 1000)
- **Retry mechanism** - automatic event restoration on send failures
- **Event enrichment** - automatic metadata addition (event_id, trace_id, timestamp, version, platform, etc.)
- **Typed API** - strongly typed events via Proxy-based API

## Usage

```typescript
const manager = new AnalyticsManager({
    endpoint: 'https://analytics.ton.org',
    batchTimeoutMs: 5000,  // Timeout for batch sending
    maxBatchSize: 100,     // Maximum batch size
    appInfo: {
        env: 'wallet',
        platform: 'ios',
        browser: 'safari',
        appName: 'MyWallet',
        appVersion: '1.0.0',
        getLocale: () => 'en-US',
        getCurrentUserId: () => 'user-123'
    }
});

// Create scoped analytics with shared data
const analytics = manager.scoped({ 
    session_id: 'session-123' 
});

// Send events via typed API
analytics.emitConnectionCompleted({ 
    client_id: 'client-123',
    connection_type: 'qr'
});
```

## Event Enrichment

Each event is automatically enriched with the following data:

- `event_id` - unique UUID v7
- `trace_id` - UUID v7 for tracing (or user-provided value is preserved)
- `client_timestamp` - Unix timestamp
- `version` - SDK version
- `subsystem` - subsystem (walletkit/bridge)
- `client_environment` - environment (wallet/bridge)
- `platform` - platform (ios/android/web)
- `browser` - browser name
- `wallet_app_name` - application name
- `wallet_app_version` - application version
- `locale` - user locale (if provided)
- `user_id` - user ID (if provided)

## Generate Types from Swagger

To update TypeScript types from Swagger specification:

```bash
node src/analytics/swagger/update-generated.js
```

The script performs:
1. Downloads `https://analytics.ton.org/swagger/doc.json`
2. Applies all transformations (see below)
3. Generates TypeScript types via `swagger-typescript-api`
4. Saves result to `generated.ts`

### Swagger Data Transformations

The following transformations are applied when generating TypeScript types from Swagger specification:

### 1. **event_name: enum → const**
- Fields `event_name` with a single enum value are converted to `const` for strict typing
- Example: `enum: ["", "connection-completed"]` → `const: "connection-completed"`

### 2. **Remove empty strings from enums**
- All enum arrays are cleaned of empty strings (`""`)
- Conversion to `anyOf` structure: `[const1, const2, ..., { type: "string" }]`

### 3. **Add required fields**
- `event_name` is marked as required for all events
- Optional fields `locale` and `browser` are added if missing

### 4. **Add wallet_id**
- Field `wallet_id` is added for wallet-connect events if missing
- Events: `wallet-connect-accepted`, `wallet-connect-rejected`, `wallet-connect-response-sent`
