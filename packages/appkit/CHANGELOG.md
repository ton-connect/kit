# @ton/appkit

## 0.0.4-alpha.2

### Patch Changes

- 72930db: - Add `getMasterchainInfo` to `ApiClient`, currently implemented in `ApiClientToncenter` and `ApiClientTonApi`.
    - Add `getBlockNumber` action to `@ton/appkit`.
    - Add `useBlockNumber` hook to `@ton/appkit-react`.
- Updated dependencies [72930db]
    - @ton/walletkit@0.0.11-alpha.2

## 0.0.4-alpha.1

### Patch Changes

- Updated dependencies
    - @ton/walletkit@0.0.11-alpha.1

## 0.0.4-alpha.0

### Patch Changes

- Updated dependencies
    - @ton/walletkit@0.0.11-alpha.0

## 0.0.3

### Patch Changes

- 3337750: - Added support for Tetra network and `ApiClientTonApi` implementation for WalletKit.
    - Added `getDefaultNetwork`, `setDefaultNetwork` and `watchDefaultNetwork` in AppKit.
    - Added `useDefaultNetwork` and `useNetworks` hooks in `@ton/appkit-react`.
    - Internal refactoring in WalletKit API clients via abstract `BaseApiClient`.
    - `ApiClient` `sendBoc` now returns Hex strings (`0x`).
    - Fixed infinite re-render in `useNetworks` hook.
    - It is now possible to subscribe to `defaultNetwork` updates via the internal event bus (`emitter`).
    - Updated `TonConnectConnector` to natively subscribe to `NETWORKS_EVENTS.DEFAULT_CHANGED` for automatic network switching.
- 7d7398a: Renamed useNFTsByAddress to useNftsByAddress
- Updated dependencies [3337750]
- Updated dependencies [9c1a73d]
    - @ton/walletkit@0.0.10

## 0.0.2

### Patch Changes

- ac2a290: Add possibility to get transaction status by boc or hash. Added 0x prefix for hash from ApiClient.sendBoc
- Updated dependencies [97e06e7]
- Updated dependencies [ac2a290]
    - @ton/walletkit@0.0.9

## 0.0.1

### Patch Changes

- Alpha release
