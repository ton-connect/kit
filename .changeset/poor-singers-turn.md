---
'@ton/walletkit': patch
---

Major API restructuring with new wallet interfaces and a Network object.

- The `Network` object replaces the `CHAIN` enum (`Network.mainnet()`, `Network.testnet()`)
- Added multi-network support
- Refactored most models with field names updated to camelCase (e.g. `validUntil`, `extraCurrency`)
