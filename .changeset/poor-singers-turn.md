---
'@ton/walletkit': patch
---

Major API restructuring with new wallet interfaces, Network object, and structured event previews

- Structured wallet API with separate interfaces for TON, Jetton, and NFT operations
- `Network` object replaces `CHAIN` enum (`Network.mainnet()`, `Network.testnet()`)
- Event models with structured `preview` data for UI
- Transaction emulation preview with money flow analysis
- Multi-network support
- Fields renamed to camelCase (e.g. `validUntil`, `extraCurrency`)
