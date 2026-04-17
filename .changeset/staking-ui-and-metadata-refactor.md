---
'@ton/appkit-react': patch
'@ton/walletkit': patch
'@ton/appkit': patch
---

- `@ton/walletkit`:
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
