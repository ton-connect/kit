---
'@ton/walletkit': major
'@ton/appkit': minor
'@ton/appkit-react': minor
---

**Staking widget and provider API**

Breaking changes in `@ton/walletkit`:
- `getSupportedUnstakeModes()` removed from `StakingProviderInterface` and `StakingProvider`; replaced by `getStakingProviderMetadata(network?)` which returns full static metadata (including unstake modes)
- `getSupportedNetworks()` added as abstract method to `StakingProvider` — existing custom subclasses must implement it
- `DefiManagerError` renamed to `DefiError`
- `lstExchangeRate` renamed to `exchangeRate` in `StakingProviderInfo`
- `StakingProviderMetadata` shape changed: flat token fields replaced with `stakeToken: StakingTokenInfo` and optional `receiveToken?: StakingTokenInfo`

Breaking changes in `@ton/appkit`:
- `getStakingProviders()` return type changed from `string[]` to `StakingProviderInterface[]`

New in `@ton/walletkit`:
- Added `StakingTokenInfo` type (exported)
- `contractAddress` is now optional in `StakingProviderMetadata` (for custodial providers)
- Added `isReversed` to `StakingQuoteParams` for reversed unstake quotes
- `TonStakersStakingProvider` accepts `metadataOverride` in config; constructor deep-merges overrides with defaults
- `BaseProvider` moved from `interfaces` to `models/core` and re-exported
- Added `TokenAddress` type (`'ton' | UserFriendlyAddress`)
- `StakingErrorCode` now exported
- `DefiError.UNSUPPORTED_NETWORK` error code added
- `StakingManager`, `StakingProvider`, `StakingError` are now value exports (not only type exports)

New in `@ton/appkit`:
- Added actions: `getStakingProvider`, `getStakingProviderMetadata`, `watchStakingProviders`
- Added utilities: `truncateDecimals`, `calcMaxSpendable`
- `StakingProviderMetadata` and `StakingTokenInfo` now exported from `@ton/appkit`

New in `@ton/appkit-react`:
- Added `StakingWidget` — full stake/unstake UI with reversed quotes, balance display, and unstake mode selector
- New components: `StakingWidgetProvider`, `StakingWidgetUi`, `StakingInfo`, `StakingBalanceBlock`, `SelectUnstakeMode`
- New hooks: `useStakingProvider`, `useStakingProviders`, `useStakingProviderInfo`, `useStakingProviderMetadata`, `useStakingQuote`, `useBuildStakeTransaction`, `useStakedBalance`
- Added English localizations for all staking UI strings
