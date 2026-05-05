---
'@ton/mcp': patch
---

Renamed `get_jetton_info` input param from `address` to `jettonAddress` for consistency with `get_jetton_balance` and other jetton tools. Updated all skill docs to match: fixed CLI arg names, added missing optional params, clarified xStocks API should use curl (not WebFetch), and specified `"TON"` as the literal fromToken string for native TON swaps.