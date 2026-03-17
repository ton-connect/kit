---
name: ton-balance
description: Check TON wallet balances, token holdings, and transaction history. Use when the user wants to check their balance, see how much TON they have, list tokens, view jettons, check transaction history, look up a token, or verify a transaction status.
user-invocable: true
disable-model-invocation: false
---

# TON Balance & Transaction Queries

Read-only queries for wallet balances, token holdings, and transaction history on TON.

## MCP Tools

| Tool | Required | Optional |
| ---- | -------- | -------- |
| `get_wallet` | — | `walletSelector` |
| `get_balance` | — | `walletSelector` |
| `get_balance_by_address` | `address` | — |
| `get_jetton_balance` | `jettonAddress` | `walletSelector` |
| `get_jettons` | — | `walletSelector` |
| `get_jettons_by_address` | `address` | — |
| `get_jetton_info` | `address` | — |
| `get_known_jettons` | — | — |
| `get_transactions` | — | `limit`, `walletSelector` |
| `get_transaction_status` | `normalizedHash` | `walletSelector` |

## Workflows

### Check Balance
1. Call `get_wallet` for address and network info
2. Call `get_balance` for TON balance
3. Call `get_jettons` for all token holdings

### Check Specific Token
1. If user mentions a token by name, call `get_known_jettons` to find its address
2. Call `get_jetton_balance` with the `jettonAddress`

### View Transaction History
1. Call `get_transactions` with an optional `limit` (default varies)

### Verify a Sent Transaction
1. Call `get_transaction_status` with the `normalizedHash` returned by a send/swap operation

## Notes

- All tools are read-only — no confirmation needed
- In registry mode, pass `walletSelector` to query a specific wallet instead of the active one
- Amounts are returned in human-readable format (e.g., "1.5" = 1.5 TON)
