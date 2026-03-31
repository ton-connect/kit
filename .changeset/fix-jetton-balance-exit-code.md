---
'@ton/walletkit': patch
---

Fixed `getJettonBalanceFromClient` to return `'0'` when the jetton wallet contract returns a non-zero exit code instead of throwing
