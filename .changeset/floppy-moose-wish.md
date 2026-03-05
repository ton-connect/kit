---
'@ton/walletkit': patch
'@ton/appkit': patch
'@ton/appkit-react': patch
---

- Added support for Tetra network and `ApiClientTonApi` implementation for WalletKit.
- Added `getDefaultNetwork`, `setDefaultNetwork` and `watchDefaultNetwork` in AppKit.
- Added `useDefaultNetwork` and `useNetworks` hooks in `@ton/appkit-react`.
- Internal refactoring in WalletKit API clients via abstract `BaseApiClient`.
- `ApiClient` `sendBoc` now returns Hex strings (`0x`).
- Fixed infinite re-render in `useNetworks` hook.
- It is now possible to subscribe to `defaultNetwork` updates via the internal event bus (`emitter`).
- Updated `TonConnectConnector` to natively subscribe to `NETWORKS_EVENTS.DEFAULT_CHANGED` for automatic network switching.
