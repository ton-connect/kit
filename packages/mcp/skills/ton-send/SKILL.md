---
name: ton-send
description: Send GRAM (ex. TON) or jettons (tokens) to an address or TON DNS domain. Use when the user wants to send GRAM (ex. TON), transfer tokens, send jettons, pay someone, send funds to a .ton or .t.me domain, or transfer assets on the TON blockchain.
user-invocable: true
disable-model-invocation: false
---

# Send GRAM (ex. TON) & Tokens

Transfer GRAM (ex. TON) or jettons to any address. Supports TON DNS resolution for `.ton` and `.t.me` domains.

## MCP Tools

| Tool | Required | Optional |
| ---- | -------- | -------- |
| `build_ton_transfer` | `toAddress`, `amount` | `comment`, `walletSelector` |
| `build_jetton_transfer` | `toAddress`, `jettonAddress`, `amount` | `comment`, `walletSelector` |
| `emulate_transaction` | `messages` | `validUntil` |
| `send_raw_transaction` | `messages` | `validUntil`, `fromAddress`, `walletSelector` |
| `resolve_dns` | `domain` | — |
| `back_resolve_dns` | `address` | — |

`build_ton_transfer` and `build_jetton_transfer` do NOT broadcast — they return ready-to-send `transaction.messages` plus `transaction.fromAddress`. Preview with `emulate_transaction`, then broadcast with `send_raw_transaction`.

## Workflows

### Send GRAM (ex. TON)
1. If the user provides a DNS name (e.g., `foundation.ton`, `user.t.me`) instead of a raw address, call `resolve_dns` first
2. Call `build_ton_transfer` with address and amount to build the transaction (it is NOT sent)
3. Preview it with `emulate_transaction` using the returned `transaction.messages` (recommended before broadcasting)
4. Ask one short yes/no confirmation that restates the amount and recipient
5. Broadcast with `send_raw_transaction` passing the `transaction.messages` and `transaction.fromAddress`
6. Poll `get_transaction_status` with the returned `normalizedHash` until status is `completed` or `failed` (see `ton-balance` skill). User can ask to skip polling.

### Send Jetton (Token)
1. If user mentions a token by name, call `get_known_jettons` (see `ton-balance` skill) to find the `jettonAddress`
2. Call `get_jetton_balance` to verify sufficient balance
3. Call `build_jetton_transfer` with the `jettonAddress`, `toAddress`, and `amount` to build the transaction (it is NOT sent)
4. Preview it with `emulate_transaction` using the returned `transaction.messages` (recommended before broadcasting)
5. Ask one short yes/no confirmation before sending
6. Broadcast with `send_raw_transaction` passing the `transaction.messages` and `transaction.fromAddress` (jetton messages target the sender's jetton wallet)
7. Poll `get_transaction_status` until completed or failed

## Notes

- Amounts are human-readable (e.g., `"1.5"` = 1.5 GRAM (ex. TON), `"100"` = 100 tokens)
- `build_ton_transfer`/`build_jetton_transfer` build the transaction only; `send_raw_transaction` is the tool that actually signs and broadcasts
- Use `emulate_transaction` to preview expected balance changes before broadcasting (fake signature)
- Always confirm with the user before broadcasting a transfer; prefer the host client's structured confirmation UI when available, otherwise accept natural-language yes/no and do not require a fixed confirmation phrase
- After broadcasting, poll `get_transaction_status` by default. User can specify whether to check status.
- If no wallet is configured, use the `ton-create-wallet` skill first
