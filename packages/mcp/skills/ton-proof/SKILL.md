---
name: ton-proof
description: Generate TonConnect TonProof signatures for third-party authentication. Use when the user wants to log in with a TON wallet, prove wallet ownership, authenticate to an API such as GetGems, or generate a TonProof for a domain and challenge payload.
user-invocable: true
disable-model-invocation: false
---

# TON Proof Authentication

Generate a signed TonConnect proof-of-ownership payload for a domain and challenge string. This proves control of the active wallet without sending a transaction.

## MCP Tools

| Tool | Required | Optional |
| ---- | -------- | -------- |
| `generate_ton_proof` | `domain`, `payload` | `walletSelector` |
| `get_wallet` | — | `walletSelector` |

## Workflow

1. Get the exact `domain` and `payload` from the user or the verifying service
2. Do not edit, normalize, decode, or invent the payload; it is part of the signed proof
3. Ask one short yes/no confirmation before sending; If there are tools for dialogs/confirmation available, use them instead of a free-text prompt.
4. Call `generate_ton_proof` with the domain and payload
5. Return the proof JSON to the user, or submit it to the service only when the user explicitly asked for that integration step

## Output

The proof includes:

- `address`: active wallet address in raw format
- `chain`: TON Connect chain id (`-239` for mainnet, `-3` for testnet)
- `walletStateInit`: wallet state init in base64
- `publicKey`: wallet public key
- `timestamp`: Unix timestamp used in the proof
- `domainLengthBytes` and `domainValue`: signed domain metadata
- `signature`: base64 TonProof signature
- `payload`: original challenge payload

## Notes

- TonProof is for authentication and proof of wallet ownership; it does not transfer funds
- TonProof still requires signing access. Imported read-only agentic wallets need operator key rotation completed before this tool can generate a proof
- Only generate a proof for domains and payloads the user intentionally provided or that came directly from the verifying service
- If multiple wallets are configured, pass `walletSelector` instead of changing the active wallet for a one-off proof
- If no wallet is configured, use the `ton-create-wallet` skill first
