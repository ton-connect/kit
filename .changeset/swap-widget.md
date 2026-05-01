---
'@ton/walletkit': major
'@ton/appkit': minor
'@ton/appkit-react': minor
---

**Swap widget and provider API**

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
