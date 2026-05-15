---
'@ton/walletkit': minor
'@ton/mcp': patch
'@ton/walletkit-android-bridge': patch
'@ton/walletkit-ios-bridge': patch
---

Renamed `FullAccountState` → `AccountState`, moved to `api/models/blockchain/` alongside `TransactionId`. `AccountState` now has `address` (canonical bouncable) and split `rawBalance` (nanotons) / `balance` (formatted TON). `AccountState`/`AccountStatus` from `transactions/Transaction.ts` renamed to `TransactionAccountState`/`TransactionAccountStatus`.
