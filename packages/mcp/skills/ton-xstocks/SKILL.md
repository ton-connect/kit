---
name: ton-xstocks
description: Buy or sell Backed xStocks (tokenized equities, e.g. TSLAx) on TON using jetton addresses from the xStocks API and TON MCP swap tools. Use when the user asks for xStocks, xStock, TSLAx, stock tokens on TON, or buying/selling equity jettons via Omniston.
user-invocable: true
disable-model-invocation: false
---

# xStocks on TON (buy / sell)

Backed **xStocks** are jettons on TON. Resolve the **jetton master** from the public xStocks API, then use the same **quote → execute** flow as `ton-swap`, with routing preferences learned from real Omniston behavior.

> **Critical: USDT is the only working swap pair.**  
> Omniston consistently returns **no quote** for TON → xStock and xStock → TON routes.  
> All xStock buys and sells **must** go through USDT. If the user lacks sufficient USDT, buy USDT with TON first (see §Pre-fund USDT below).

## Key addresses

| Token | Jetton master |
| ----- | ------------- |
| USDT (TON) | `EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs` |

## Resolve the TON jetton master for an xStock

1. **By symbol** (e.g. `TSLAx`): fetch via **`curl`** (not WebFetch — the xStocks API returns 403 for non-standard user-agents):
   ```bash
   curl -s "https://api.xstocks.fi/api/v2/public/assets/{symbol}"
   ```
   (production base: `https://api.xstocks.fi/api/v2` — see [xStocks API](https://docs.xstocks.fi/apis/openapi)).

2. In the JSON, find `deployments[]` where **`network` is `"Ton"`**. Use that object's **`address`** as the jetton master for MCP (`fromToken` / `toToken`).

3. Optional: `curl -s "https://api.xstocks.fi/api/v2/public/assets"` returns all assets with the same `deployments` shape.

4. Call `get_jetton_info` with `--jettonAddress <jetton_master>` to confirm **name / symbol / decimals** before swapping.

## MCP tools

| Action | Tools |
| ------ | ----- |
| Pre-fund USDT | `get_jetton_balance` (USDT) → `get_swap_quote` (TON → USDT) → `emulate_transaction` → `send_raw_transaction` |
| Buy xStock | `get_swap_quote` (USDT → xStock) → `emulate_transaction` → `send_raw_transaction` |
| Sell xStock | `get_jetton_balance` (xStock) → `get_swap_quote` (xStock → USDT) → `emulate_transaction` → `send_raw_transaction` |
| Verify | `get_jetton_info`, `get_transaction_status`, `get_jetton_balance` |

Amounts for `get_swap_quote` are **human-readable** strings (respect jetton decimals from `get_jetton_info`).

## CLI argument names (exact)

| Tool | Arg | CLI flag |
| ---- | --- | -------- |
| `get_jetton_info` | jettonAddress | `--jettonAddress` |
| `get_jetton_balance` | jettonAddress | `--jettonAddress` |
| `get_swap_quote` | fromToken | `--fromToken` (use `"TON"` for native TON, jetton master address for tokens) |
| `get_swap_quote` | toToken | `--toToken` |
| `get_swap_quote` | amount | `--amount` (human-readable) |
| `get_swap_quote` | slippageBps | `--slippageBps` (default 100 = 1%) |
| `emulate_transaction` | messages | `--messages` (JSON array from quote's `transaction.messages`) |
| `send_raw_transaction` | messages | `--messages` (same JSON array) |
| `get_transaction_status` | normalizedHash | `--normalizedHash` |

## Pre-fund USDT (auto, when needed)

Before any xStock trade, check the user's USDT balance:

1. `get_jetton_balance` for the USDT master address — use the `amount` field for comparison.
2. If `amount` **< required amount** for the planned buy:
   a. Calculate the shortfall (include a small buffer for price movement).
   b. `get_swap_quote` with `fromToken` = `"TON"` (the literal string, not an address), `toToken` = USDT master, `amount` = shortfall.
   c. Confirm with the user: *"You need ~X USDT but only have Y. Swap Z TON → X USDT first?"*
   d. On approval, `send_raw_transaction` → poll `get_transaction_status` until `completed`.
   e. Re-check USDT balance before proceeding to the xStock buy.

## Buy workflow

1. Resolve the **Ton** jetton master for the xStock symbol (API above).
2. Check USDT balance — run **Pre-fund USDT** if insufficient.
3. `get_swap_quote`: `fromToken` = USDT master, `toToken` = xStock master, `amount` = USDT to spend, `slippageBps` = 100 (1 %).
4. `emulate_transaction` with the quote's `transaction.messages` — verify expected balance changes before sending.
5. Show the user: **fromAmount**, **toAmount**, **minReceived**, **expiresAt**, emulation results, and note the forward **TON** on router messages (gas).
6. Confirm once, then `send_raw_transaction` with the returned `transaction.messages`.
7. Poll `get_transaction_status` on `normalizedHash` until `completed` or `failed`.

> **Do not attempt TON → xStock directly.** It will return no quote. Always route through USDT.

## Sell workflow ("sell all" or fixed amount)

1. `get_jetton_balance` for the xStock master → use the returned `amount` field (already a human-readable decimal string, e.g. `"12.5"`). Use `amountRaw` only if a raw integer is needed elsewhere.
2. Pass `amount` directly as the `amount` parameter for `get_swap_quote` — no manual conversion needed.
3. `get_swap_quote`: `fromToken` = xStock master, `toToken` = USDT master.
4. `emulate_transaction` with the quote's `transaction.messages` — verify expected balance changes.
5. Show the user the quote details and emulation results, then confirm.
6. `send_raw_transaction`, then poll `get_transaction_status` until `completed` or `failed`.

> **Do not attempt xStock → TON directly.** Always sell into USDT.

## Post-trade checks

- If balance reads **0** immediately after a buy, wait a few seconds and re-query; indexers can lag.
- After a sell, confirm USDT balance increased as expected.

## Omniston quirks

- **"No quote available"** — no route at that size / time. Retry after a short wait, or adjust amount / slippage slightly. Do **not** switch to TON pairing; it won't help.
- Occasional WebSocket errors (e.g. quote ack) — **retry** `get_swap_quote`.
- Quotes **expire**; if the user waited before confirming, fetch a fresh quote before executing.

## Relations

- Execution and confirmation rules: **`ton-swap`** skill.
- Wallet funding and status polling: **`ton-balance`** skill.
- Issuance / redemption outside DEX: xStocks product docs / dashboard — not covered by MCP swap alone.