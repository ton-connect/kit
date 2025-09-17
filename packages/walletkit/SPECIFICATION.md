## TonWalletKit Specification

This document defines the public API, data types, and behaviors of `@ton/walletkit`. It serves as the source of truth for integrators and for maintaining compatibility.

### Package entry

- Entry: `packages/walletkit/src/index.ts`
- Main class: `TonWalletKit`
- Re-exports: all public types under `packages/walletkit/src/types`, core managers, and wallet v5r1 utilities.

### Installation

- Package name: `@ton/walletkit`
- Peer deps: `@ton/core`, `@ton/ton`, `@tonconnect/protocol`, `bridge-sdk`

### Initialization

Constructor:

```
new TonWalletKit(options: TonWalletKitOptions)
```

- Initializes lazily; methods ensure readiness internally.
- Internally constructs and wires: `WalletManager`, `SessionManager`, `BridgeManager`, `EventRouter`, `RequestProcessor`, `ResponseHandler`, and a shared `TonClient`.

TonWalletKitOptions:

```
{
  bridgeUrl: string;                    // Required TON Connect bridge URL
  apiUrl?: string;                      // Optional TON API endpoint (defaults to toncenter)
  apiKey?: string;                      // Optional TON API key
  wallets?: WalletInitConfig[];         // Optional wallets to pre-load
  storage?: StorageAdapter;             // Optional persistence adapter
  network?: CHAIN.MAINNET;              // Target network
  config?: {
    bridge?: { heartbeatInterval?: number; reconnectInterval?: number; maxReconnectAttempts?: number };
    storage?: { prefix?: string; cacheTimeout?: number; maxCacheSize?: number } | StorageAdapter;
    validation?: { strictMode?: boolean; allowUnknownWalletVersions?: boolean };
  };
}
```

Notes:
- If `storage` is omitted, a `LocalStorageAdapter` is used when available, otherwise in-memory.
- `wallets` are validated before addition. Unsupported versions cause errors.

### Public API (class TonWalletKit)

- Wallet management:
  - `getWallets(): WalletInterface[]`
    - Returns currently registered wallets (empty array if not yet initialized).
  - `getWallet(address: string): WalletInterface | undefined`
    - Returns wallet by address if present.
  - `addWallet(walletConfig: WalletInitConfig): Promise<void>`
    - Accepts a `WalletInterface` or `WalletInitConfigMnemonic` or `WalletInitConfigPrivateKey`.
    - Validates and registers the wallet.
  - `removeWallet(wallet: WalletInterface): Promise<void>`
    - Removes wallet and associated sessions.
  - `clearWallets(): Promise<void>`
    - Removes all wallets and clears sessions.

- Session management:
  - `disconnect(sessionId?: string): Promise<void>`
    - If `sessionId` is provided, removes that session; otherwise clears all sessions.
  - `listSessions(): Promise<Array<{ sessionId: string; dAppName: string; walletAddress: string }>>`
    - Returns simple session descriptors for UI/state.

- Event handler registration:
  - `onConnectRequest(cb: (e: EventConnectRequest) => void): void`
  - `onTransactionRequest(cb: (e: EventTransactionRequest) => void): void`
  - `onSignDataRequest(cb: (e: EventSignDataRequest) => void): void`
  - `onDisconnect(cb: (e: EventDisconnect) => void): void`

- URL processing:
  - `handleTonConnectUrl(url: string): Promise<void>`
    - Parses TON Connect URLs and routes a synthetic `connect` event.
    - Errors if URL is malformed or missing required `v`, `id`, `r` params.

- Request processing:
  - `approveConnectRequest(event: EventConnectRequest): Promise<void>`
  - `rejectConnectRequest(event: EventConnectRequest, reason?: string): Promise<void>`
  - `approveTransactionRequest(event: EventTransactionRequest): Promise<{ signedBoc: string }>`
  - `rejectTransactionRequest(event: EventTransactionRequest, reason?: string): Promise<void>`
  - `signDataRequest(event: EventSignDataRequest): Promise<{ signature: Uint8Array }>`
  - `rejectSignDataRequest(event: EventSignDataRequest, reason?: string): Promise<void>`

- TON client access and lifecycle:
  - `getTonClient(): TonClient`
  - `isReady(): boolean`
  - `waitForReady(): Promise<void>`
  - `getStatus(): { initialized: boolean; ready: boolean }`
  - `close(): Promise<void>`

### Wallet configuration types

- `WalletInitConfigMnemonic`:
  - `{ mnemonic: string[]; version?: 'v5r1' | 'unknown'; mnemonicType?: 'ton' | 'bip39'; walletId?: number; network?: CHAIN }`

- `WalletInitConfigPrivateKey`:
  - `{ privateKey: string; version?: 'v5r1' | 'unknown'; walletId?: number; network?: CHAIN }`

- Union: `WalletInitConfig = WalletInterface | WalletInitConfigMnemonic | WalletInitConfigPrivateKey`

### Wallet interface

```
interface WalletInterface {
  publicKey: Uint8Array;                       // Unique key
  version: string;                             // Contract version, e.g. 'v5r1'
  sign(bytes: Uint8Array): Promise<Uint8Array>;
  getAddress(options?: { testnet?: boolean }): string;
  getBalance(): Promise<bigint>;
  getStateInit(): Promise<string>;             // base64 boc
  getSignedExternal(
    input: ConnectTransactionParamContent,
    options: { fakeSignature: boolean },
  ): Promise<string>;                          // base64 signed external message boc
}
```

### Event types

- `EventConnectRequest`:
  - `{ id: string; dAppName: string; dAppUrl: string; manifestUrl: string; request: ConnectRequest['items']; preview: ConnectPreview; wallet?: WalletInterface }`
  - `ConnectPreview`: `{ manifest?: { name: string; description?: string; url?: string; iconUrl?: string }; requestedItems?: string[]; permissions?: Array<{ name: string; title: string; description: string }>; }`

- `EventTransactionRequest`:
  - Extends raw bridge `SendTransactionRpcRequest` with:
    - `id: string`
    - `request: ConnectTransactionParamContent`
    - `preview: TransactionPreview`
    - `wallet: WalletInterface`
  - `ConnectTransactionParamContent` (parsed payload):
    - `{ messages: { address: string; amount: string; payload?: string; stateInit?: string; extraCurrency?: { [k: number]: string } }[]; network: string; valid_until: number; from?: string }`
  - `TransactionPreview`:
    - `{ moneyFlow: MoneyFlow }` where `MoneyFlow` is derived from toncenter emulation results.

- `EventSignDataRequest`:
  - `{ id: string; data: Uint8Array; preview: SignDataPreview; wallet: WalletInterface }`
  - `SignDataPreview`: `{ kind: 'text' | 'json' | 'bytes'; content: string; metadata?: { size: number; hash: string; encoding: string } }`

- `EventDisconnect`:
  - `{ reason?: string; wallet: WalletInterface }`

### Behavior and flows

- Connect flow:
  1. `handleTonConnectUrl(url)` parses URL and emits a synthetic `RawBridgeEventConnect`.
  2. `EventRouter` validates and routes to `ConnectHandler`.
  3. `ConnectHandler` fetches manifest (best-effort), constructs `EventConnectRequest`, and invokes registered `onConnectRequest` callbacks.
  4. App calls `approveConnectRequest(event)` with `event.wallet` set to the chosen wallet, or `rejectConnectRequest`.
  5. On approval: a session is created, bridge session is established, and a TON Connect `connect` response is sent including `ton_addr` and optional `ton_proof`.

- Transaction flow:
  1. Incoming `sendTransaction` from bridge is routed to `TransactionHandler`.
  2. Handler parses and validates `ConnectTransactionParamContent` and associates a wallet.
  3. Emulates transaction to produce `TransactionPreview.moneyFlow` for UI.
  4. App calls `approveTransactionRequest(event)` to sign and send the BOC (via TON client) and responds back to dApp, or `rejectTransactionRequest`.

- Sign data flow:
  1. Incoming `signData` routed to `SignDataHandler`.
  2. Handler normalizes payload to `Uint8Array` and produces `SignDataPreview`.
  3. App calls `signDataRequest(event)` or `rejectSignDataRequest`.

- Disconnect flow:
  - Incoming `disconnect` routed to `DisconnectHandler`; callbacks receive `EventDisconnect`.

### Managers (overview)

- `WalletManager`
  - In-memory registry with validation and (placeholder) persistence hooks.
  - Keys wallets by `wallet.getAddress()`.

- `SessionManager`
  - Persists lightweight session metadata.
  - Creates per-session keypairs via `SessionCrypto`.
  - Provides API-facing session summaries.

- `BridgeManager`
  - Wraps `bridge-sdk` with wallet-side behavior.
  - Maintains connection, restores clients, and sends responses using session crypto.

- `EventRouter`
  - Validates events then delegates to handlers and notifies app callbacks.

- `RequestProcessor`
  - Implements approvals/rejections including signing, TON client submission, and bridge responses.

- `ResponseHandler`
  - Common response formatting and error helpers.

### Errors

- Malformed TON Connect URLs: `Error('Invalid TON Connect URL format')`.
- Missing wallet on approval: `Error('Wallet is required')`.
- Transaction parsing/validation failures: throw with descriptive message; caller should catch and present to user.
- Bridge send failures bubble up from `BridgeManager.sendResponse`.

### Versioning and compatibility

- Wallet versions supported: `'v5r1'` via `WalletV5R1Adapter` (others may be added later).
- Public API is defined by `types/kit.ts` and implemented in `core/TonWalletKit.ts`.

### Utilities and contracts (selected)

- Contracts: `WalletV5`, `WalletV5R1Adapter`, `createWalletV5R1` re-exported for advanced users.
- Storage: `LocalStorageAdapter`, `MemoryStorageAdapter`, `createStorageAdapter`.


