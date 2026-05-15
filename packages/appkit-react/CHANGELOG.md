# @ton/appkit-react

## 1.0.0-alpha.0

### Major Changes

- AppKit V1

### Minor Changes

- c1f5243: **Staking widget and provider API**

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

- c1f5243: **Swap widget and provider API**

    Breaking changes in `@ton/walletkit`:
    - `DefiManagerError` renamed to `DefiError`; update any `catch (e instanceof DefiManagerError)` or direct import
    - `SwapFee` type removed; `fee` field removed from `SwapQuote`
    - `getSupportedNetworks()` and `getMetadata()` added as abstract methods to `SwapProvider` — existing custom provider subclasses must implement them

    New in `@ton/walletkit`:
    - Added `SwapProviderMetadata` and `SwapProviderMetadataOverride` types
    - `getMetadata()` on `SwapProviderInterface` returns static display info (name, logo, URL)
    - `getSupportedNetworks()` on `SwapProviderInterface` returns supported networks
    - `DeDustSwapProvider` and `OmnistonSwapProvider` expose metadata; both accept `metadataOverride` in config
    - `getProviders()` replaces `getRegisteredProviders()` — returns `SwapProviderInterface[]` instead of `string[]`
    - `removeProvider()` added to `DefiManagerAPI`
    - Re-registering a provider with an existing id now replaces it instead of throwing
    - `DefiError.UNSUPPORTED_NETWORK` error code added
    - `SwapError`, `SwapManager`, `SwapProvider` are now value exports (not only type exports)
    - Providers emit `provider:registered` and `provider:default-changed` events on `AppKit`'s event emitter

    New in `@ton/appkit`:
    - Added actions: `getSwapProvider`, `getSwapProviders`, `watchSwapProviders`, `setDefaultSwapProvider`
    - `getSwapQuote` now resolves the active network automatically when `network` is omitted
    - Added utilities: `calcFiatValue`, `formatLargeValue`, `debounce`, `calcMaxSpendable`, `getTonShortfall`

    New in `@ton/appkit-react`:
    - Added `SwapWidget` — full-featured swap UI with token selection, amount input, slippage settings, provider picker, and top-up flow
    - New components: `SwapField`, `SwapFlipButton`, `SwapInfo`, `SwapSettingsButton`, `SwapSettingsModal`, `SwapTokenSelectModal`, `SwapWidgetProvider`, `SwapWidgetUi`
    - New hooks: `useSwapProvider`, `useSwapProviders`, `useSwapQuote`, `useBuildSwapTransaction`
    - Added generic `LowBalanceModal` component (shared with staking widget)
    - New utility hooks: `useDebounceCallback`, `useDebounceValue`, `useUnmount`
    - New shared components: `Input`, `Modal`, `Dialog`, `Skeleton`, `Tabs`, `InfoBlock`, `Collapsible`, `CenteredAmountInput`, `AmountPresets`, `TokenSelectModal`, `Logo`, `AmountReversed`
    - Added `AppKitUIToken` type for CSS custom property tokens
    - `useAppKit`, `useAppKitTheme`, `useI18n` moved to `features/settings` (still re-exported from the package root — no import path change needed)
    - `CircleIcon` renamed to `Logo` with an extended API; replace `<CircleIcon src=... />` with `<Logo src=... />`
    - Added English localizations for all swap UI strings

### Patch Changes

- fd7e89f: Added support for new TonConnect features: SignMessage, StructeredItems, EmbeddedRequests
- 5b75f27: - `@ton/appkit`:
    - added `getSwapProvider` and `watchSwapProviders` actions
    - added swap-related events and types to `AppKit` core
    - added `calcFiatValue` and `formatLargeValue` amount utilities
    - added `debounce` utility function
    - `@ton/walletkit`:
        - added `SwapProviderMetadata` interface
        - added `getMetadata()` method to `SwapProvider`
        - added metadata support to `DeDustSwapProvider` and `OmnistonSwapProvider`
    - `@ton/appkit-react`:
        - added `SwapWidget` and related UI components (`SwapField`, `SwapSettings`, `TokenSelector`, etc.)
        - added `SwapWidgetProvider` for swap state management
        - added hooks for swap: `useSwapProvider`, `useSwapQuote`, `useBuildSwapTransaction`
        - added `useDebounceCallback`, `useDebounceValue`, and `useUnmount` utility hooks
        - added English localizations for swap features
- 50c5bf3: - `@ton/walletkit`:
    - refactored `StakingProviderMetadata`: flat token fields replaced with `stakeToken: StakingTokenInfo` object and optional `receiveToken?: StakingTokenInfo` group to support both liquid and custodial staking providers
    - made `contractAddress` optional in `StakingProviderMetadata` for custodial providers without on-chain contracts
    - renamed `lstExchangeRate` to `exchangeRate` in `StakingProviderInfo`
    - added `StakingTokenInfo` type export
    - added `isReversed` parameter to `StakingQuoteParams` for reversed unstake quotes
    - added deep-merge support for metadata overrides in `TonStakersStakingProvider` constructor
    - added `getStakingProvider` and `watchStakingProviders` to `DefiManager`
    - `@ton/appkit`:
        - added `getStakingProviderMetadata`, `getStakingProvider`, and `watchStakingProviders` actions
        - added `truncateDecimals` and `formatLargeValue` amount utilities
        - exported `StakingTokenInfo` type
    - `@ton/appkit-react`:
        - added `StakingWidget` with full stake/unstake UI, balance display, reversed quotes, and unstake mode selector
        - updated base design tokens to TonConnect colors
        - added staking hooks and i18n translations
- Updated dependencies
- Updated dependencies [70efd43]
- Updated dependencies [fd7e89f]
- Updated dependencies [5b75f27]
- Updated dependencies [50c5bf3]
- Updated dependencies [c1f5243]
- Updated dependencies [c1f5243]
- Updated dependencies [c67bb0e]
    - @ton/appkit@1.0.0-alpha.4

## 0.0.6-alpha.3

### Patch Changes

- @ton/appkit@0.0.5-alpha.3

## 0.0.6-alpha.2

### Patch Changes

- d411dff: Renamed `Transaction` component to `Send` and updated all associated types and hooks:
    - `Transaction` → `Send`
    - `TransactionProps` → `SendProps`
    - `TransactionRenderProps` → `SendRenderProps`
    - `TransactionRequest` → `SendRequest`
    - `TransactionProvider` → `SendProvider`
    - `TransactionContext` → `SendContext`
    - `TransactionContextType` → `SendContextType`
    - `TransactionProviderProps` → `SendProviderProps`
    - `useTransactionContext` → `useSendContext`

- 1f552f7: Added new connector and provider factory options
- 4a060fb: Implemented staking infrastructure including \`StakingManager\` and \`TonStakersStakingProvider\` with support for multiple unstake modes (delayed, instant, best rate). Added core type updates and exported staking features from the package root.
- Updated dependencies [1f552f7]
- Updated dependencies [4a060fb]
    - @ton/appkit@0.0.5-alpha.2

## 0.0.6-alpha.1

### Patch Changes

- @ton/appkit@0.0.5-alpha.1

## 0.0.6-alpha.0

### Patch Changes

- @ton/appkit@0.0.5-alpha.0

## 0.0.5

### Patch Changes

- babd2af: Implemented and improved multiple methods in `ApiClientTonApi`: `jettonsByOwnerAddress`, `nftItemsByAddress`, `nftItemsByOwner`, `runGetMethod`, `getAccountTransactions`, `getTransactionsByHash`, `getTrace`, `getPendingTrace`, `getEvents`, and `getMasterchainInfo`.
- 29d0d22: Updated `SwapQuote` and `SwapQuoteParams` types: changed `amount`, `fromAmount`, `toAmount`, and `minReceived` from `TokenAmount` to `string`. This change was made because these fields now contain values already formatted into a human-readable format, whereas `TokenAmount` is intended for nano amounts.
- 72930db: - Add `getMasterchainInfo` to `ApiClient`, currently implemented in `ApiClientToncenter` and `ApiClientTonApi`.
    - Add `getBlockNumber` action to `@ton/appkit`.
    - Add `useBlockNumber` hook to `@ton/appkit-react`.
- Updated dependencies [babd2af]
- Updated dependencies [29d0d22]
- Updated dependencies [72930db]
    - @ton/appkit@0.0.4

## 0.0.5-alpha.2

### Patch Changes

- 72930db: - Add `getMasterchainInfo` to `ApiClient`, currently implemented in `ApiClientToncenter` and `ApiClientTonApi`.
    - Add `getBlockNumber` action to `@ton/appkit`.
    - Add `useBlockNumber` hook to `@ton/appkit-react`.
- Updated dependencies [72930db]
    - @ton/appkit@0.0.4-alpha.2

## 0.0.5-alpha.1

### Patch Changes

- @ton/appkit@0.0.4-alpha.1

## 0.0.5-alpha.0

### Patch Changes

- @ton/appkit@0.0.4-alpha.0

## 0.0.4

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
- Updated dependencies [7d7398a]
    - @ton/appkit@0.0.3

## 0.0.3

### Patch Changes

- ac2a290: Add possibility to get transaction status by boc or hash. Added 0x prefix for hash from ApiClient.sendBoc
- Updated dependencies [ac2a290]
    - @ton/appkit@0.0.2

## 0.0.1

### Patch Changes

- Alpha release
