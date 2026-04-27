---
'@ton/mcp': patch
---

Added per-transaction and rolling-window spend limits for TON and jettons. Limits are configured via `limits.json` and enforced before transfers, with persisted spend state in the wallet config.
