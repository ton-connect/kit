---
name: ton-swap
description: Swap or trade tokens on the TON blockchain via DEX. Use when the user wants to swap, trade, exchange, convert, buy, or sell tokens like TON, USDT, jUSDC, or any jetton. Covers phrases like "swap TON for USDT", "trade tokens", "buy USDT", "exchange jettons".
user-invocable: true
disable-model-invocation: false
---

# Swap TON Tokens

Swap tokens on TON via DEX aggregator. Two-step flow: get a quote, confirm with the user, then execute.

## MCP Tools

| Tool | Required | Optional |
| ---- | -------- | -------- |
| `get_swap_quote` | `fromToken`, `toToken`, `amount` | `walletSelector` |
| `emulate_transaction` | `messages` | `validUntil` |
| `send_raw_transaction` | `messages` | `walletSelector` |
| `get_known_jettons` | — | — |

## Workflow

1. If the user mentions a token by name (e.g., "USDT", "jUSDC"), call `get_known_jettons` to resolve the jetton address
2. Call `get_swap_quote` with `fromToken`, `toToken`, and `amount`
   - Use `"TON"` for native TON, or the jetton master contract address for tokens
   - Amount is human-readable (e.g., `"1.5"` = 1.5 TON)
3. Call `emulate_transaction` with the quote's `transaction.messages` to dry-run the swap — verify the expected money flow (TON/jetton balance changes) before sending
4. Show the quote details and emulation results to the user and ask one short yes/no confirmation
5. Call `send_raw_transaction` with the transaction params returned by the quote
6. Poll `get_transaction_status` with the returned `normalizedHash` until status is `completed` or `failed` (see `ton-balance` skill). User can ask to skip polling.

## Notes

- Always confirm the swap with the user before executing; prefer the host client's structured confirmation UI when available, otherwise accept natural-language yes/no and do not require a fixed confirmation phrase
- The quote returns transaction messages ready for `send_raw_transaction`
- After execution, poll `get_transaction_status` by default. User can specify whether to check status.
- If no wallet is configured, use the `ton-create-wallet` skill first
