---
name: ton-send
description: Send TON or jettons (tokens) to an address or TON DNS domain. Use when the user wants to send TON, transfer tokens, send jettons, pay someone, send funds to a .ton or .t.me domain, or transfer assets on the TON blockchain.
user-invocable: true
disable-model-invocation: false
---

# Send TON & Tokens

Transfer TON or jettons to any address. Supports TON DNS resolution for `.ton` and `.t.me` domains.

## MCP Tools

| Tool | Required | Optional |
| ---- | -------- | -------- |
| `send_ton` | `toAddress`, `amount` | `comment`, `walletSelector` |
| `send_jetton` | `toAddress`, `jettonAddress`, `amount` | `comment`, `walletSelector` |
| `emulate_transaction` | `messages` | `validUntil` |
| `resolve_dns` | `domain` | — |
| `back_resolve_dns` | `address` | — |

## Workflows

### Send TON
1. If the user provides a DNS name (e.g., `foundation.ton`, `user.t.me`) instead of a raw address, call `resolve_dns` first
2. Ask one short yes/no confirmation that restates the amount and recipient
3. Call `send_ton` with address and amount
4. Poll `get_transaction_status` with the returned `normalizedHash` until status is `completed` or `failed` (see `ton-balance` skill). User can ask to skip polling.

### Send Jetton (Token)
1. If user mentions a token by name, call `get_known_jettons` (see `ton-balance` skill) to find the `jettonAddress`
2. Call `get_jetton_balance` to verify sufficient balance
3. Ask one short yes/no confirmation before sending
4. Call `send_jetton` with the `jettonAddress`, `toAddress`, and `amount`
5. Poll `get_transaction_status` until completed or failed

## Notes

- Amounts are human-readable (e.g., `"1.5"` = 1.5 TON, `"100"` = 100 tokens)
- Use `emulate_transaction` to dry-run any transaction before sending — it returns expected balance changes (TON and jetton), fees, and high-level actions so you can verify the outcome
- Always confirm with the user before executing a transfer; prefer the host client's structured confirmation UI when available, otherwise accept natural-language yes/no and do not require a fixed confirmation phrase
- After sending, poll `get_transaction_status` by default. User can specify whether to check status.
- If no wallet is configured, use the `ton-create-wallet` skill first
