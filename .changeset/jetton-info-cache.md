---
'@ton/appkit': minor
'@ton/walletkit': patch
---

Add LRU cache to `getJettonInfo` and make `jettonDecimals` optional in `useJettonBalanceByAddress`.

`@ton/appkit` now ships with a built-in LRU cache (10-minute TTL, 1000 entries) used to avoid redundant API calls to `getJettonInfo`. A custom cache can be provided via the new `cache` option in `AppKitConfig`. The `AppKitCache` interface and `LruAppKitCache` class are exported for custom implementations.

`jettonDecimals` is now optional in `useJettonBalanceByAddress` and `getJettonBalanceByAddressQueryOptions` — when omitted, decimals are resolved automatically from `getJettonInfo` (using the cache).

`@ton/walletkit`: `lru-cache` dependency pinned to the workspace catalog version.
