---
'@ton/appkit-react': patch
'@ton/walletkit': patch
'@ton/appkit': patch
---

- `@ton/appkit`:
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
