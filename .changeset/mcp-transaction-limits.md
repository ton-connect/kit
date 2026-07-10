---
'@ton/mcp': patch
---

Added on-chain-anchored spend limits for agentic wallets. Limits are set by the owner on-chain (via `ChangeNftContentMsg`) and verified client-side before every transfer against the wallet's rolling transaction history — per-transaction caps and rolling time-window caps for TON and jettons. No local limits file or persisted counters; the on-chain history is the source of truth.
