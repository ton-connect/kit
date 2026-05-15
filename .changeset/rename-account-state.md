---
'@ton/walletkit': minor
'@ton/mcp': patch
'@ton/walletkit-android-bridge': patch
'@ton/walletkit-ios-bridge': patch
---

Added `ApiClient.getAccountStates(addresses)` for fetching multiple account states in a single batched request (up to 100 addresses). Returns a `Record` keyed by canonical bouncable addresses; missing accounts are represented uniformly as `status: 'non-existing'` across both toncenter and tonapi providers.

Renamed `FullAccountState` → `AccountState`, moved to `api/models/blockchain/` alongside `TransactionId`. `AccountState` now has `address` (canonical bouncable) and split `rawBalance` (nanotons) / `balance` (formatted TON). `AccountState`/`AccountStatus` from `transactions/Transaction.ts` renamed to `TransactionAccountState`/`TransactionAccountStatus`.
