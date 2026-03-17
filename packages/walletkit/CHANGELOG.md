# @ton/walletkit

## 0.0.11-alpha.2

### Patch Changes

- 72930db: - Add `getMasterchainInfo` to `ApiClient`, currently implemented in `ApiClientToncenter` and `ApiClientTonApi`.
    - Add `getBlockNumber` action to `@ton/appkit`.
    - Add `useBlockNumber` hook to `@ton/appkit-react`.

## 0.0.11-alpha.1

### Patch Changes

- Added logs level from env for walletkit, supressed node deprecation warnings for mcp

## 0.0.11-alpha.0

### Patch Changes

- Use public version of @tonconnect/bridge-sdk

## 0.0.10

### Patch Changes

- 3337750: - Added support for Tetra network and `ApiClientTonApi` implementation for WalletKit.
    - Added `getDefaultNetwork`, `setDefaultNetwork` and `watchDefaultNetwork` in AppKit.
    - Added `useDefaultNetwork` and `useNetworks` hooks in `@ton/appkit-react`.
    - Internal refactoring in WalletKit API clients via abstract `BaseApiClient`.
    - `ApiClient` `sendBoc` now returns Hex strings (`0x`).
    - Fixed infinite re-render in `useNetworks` hook.
    - It is now possible to subscribe to `defaultNetwork` updates via the internal event bus (`emitter`).
    - Updated `TonConnectConnector` to natively subscribe to `NETWORKS_EVENTS.DEFAULT_CHANGED` for automatic network switching.
- 9c1a73d: delete dnsResolver from ApiClientConfig and use api method to resolve dns wallet

## 0.0.9

### Patch Changes

- 97e06e7: getSupportedFeatures function in WalletAdapter interface is now required for implementation
- ac2a290: Add possibility to get transaction status by boc or hash. Added 0x prefix for hash from ApiClient.sendBoc
- Added dev params to WalletKit Swift
- Added signer for tetra
- Made proof for WalletKit Swift optional

## 0.0.8

### Patch Changes

- e5cb26e: Updates buildSwapQuote params and SwapToken model. Use human-readable amount as string for amount parameter.

## 0.0.6

### Patch Changes

### Added

- Custom `SessionManager` injection support via WalletKit options
- Custom `ApiClient` implementation support for iOS/Android bridges
- Session storage versioning with migration support for future releases

### Changed

- Replace `bip39` with lightweight `@scure/bip39`

### Removed

- `@truecarry/tlb-abi` dependency
- `tlb-runtime` dependency (SignData Cell preview temporarily unavailable)

### Breaking

- Existing sessions will be invalidated due to storage format changes
- Approval API for connect/transaction/sign requests now accepts prepared results via second argument

## 0.0.5

### Patch Changes

- Update WalletKit to use Network object instead of CHAIN constants
- Generate README.md samples from real example files
- Remove function exports from types (SendModeFromValue, SendModeToValue, asHex)

## 0.0.4

### Patch Changes

- Major API restructuring with new wallet interfaces and a Network object.
- The `Network` object replaces the `CHAIN` enum (`Network.mainnet()`, `Network.testnet()`)
- Added multi-network support
- Refactored most models with field names updated to camelCase (e.g. `validUntil`, `extraCurrency`)
- Added optional setting to disable automatic transaction emulation
- Updated DefaultSignature to accept private key in both 32/64 bytes format
- Rename signDataRequest to approveSignDataRequest for consistency
- Update rejectSignDataRequest to properly respond with id
- Add exports for CreateTonProofMessageBytes, ConvertTonProofMessage
- Changed wallet key from walletAddress to walletId

## 0.0.3

### Patch Changes

- Fix local transaction sending regression introduced in 0.0.2
