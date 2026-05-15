---
'@ton/walletkit': minor
'@ton/mcp': patch
'@ton/walletkit-android-bridge': patch
'@ton/walletkit-ios-bridge': patch
---

Added `ApiClient.getAccountStates(addresses)` — batched fetch for up to 100 accounts, uniform `non-existing` for missing addresses across providers.

Breaking changes to `AccountState` (was `FullAccountState`):

- Renamed and moved to `api/models/blockchain/`.
- New required `address` field, `balance` split into `rawBalance` (nanotons) + `balance` (formatted TON).
- `code`, `data`, `lastTransaction` are now optional instead of `| null`.
- `status` uses the unified `AccountStatus` string union (`'active' | 'uninitialized' | 'frozen' | 'non-existing'`); the discriminated `TransactionAccountStatus` and `EmulationAccountStatus` have been removed.

Also fixed a bug in `BaseApiClient.buildUrl` where array query params were silently truncated to their last value.
