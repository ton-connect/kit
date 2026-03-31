---
name: ton-cli
description: Call TON MCP tools directly from the command line. Use when you want to query wallet info, check balances, send transactions, or run any TON wallet tool without starting an MCP server session. Works via `npx @ton/mcp@alpha <tool_name> [--arg value ...]`.
user-invocable: true
disable-model-invocation: false
allowed-tools: ["Bash(npx @ton/mcp@alpha *)"]
---

# TON MCP Raw CLI Mode

Run any TON wallet MCP tool directly from the command line. The binary invokes the tool, prints the JSON result to stdout, and exits.

## Invocation Modes

| Command | Description |
| ------- | ----------- |
| `npx @ton/mcp@alpha` | stdio MCP server (for Claude Desktop / MCP clients) |
| `npx @ton/mcp@alpha --http [port]` | HTTP MCP server |
| `npx @ton/mcp@alpha <tool_name> [--arg value ...]` | **Raw CLI: call one tool and exit** |

Use exactly one mode for a given workflow: either MCP server mode (`stdio`/`--http`) or raw CLI. Do not combine them in the same task/session.

## Raw CLI Usage

```bash
# No arguments
npx @ton/mcp@alpha get_balance

# Named arguments (--key value)
npx @ton/mcp@alpha get_transactions --limit 5
npx @ton/mcp@alpha get_jetton_balance --jettonAddress EQAbc...

# All values are passed as plain strings; JSON objects/arrays are also accepted
npx @ton/mcp@alpha get_transactions --limit 10
npx @ton/mcp@alpha send_ton --toAddress UQA... --amount 0.1 --comment "hi"
```

Arguments are passed as `--key value` pairs. Objects/arrays (`{...}` / `[...]`) are JSON-parsed; everything else is kept as a plain string.

## Output

All tools print JSON to **stdout**. Errors are printed to **stderr** and the process exits with code `1`.

```bash
# Capture output for scripting
BALANCE=$(npx @ton/mcp@alpha get_balance)
echo $BALANCE | jq '.balance'
```

## Environment Variables

The CLI respects the same environment variables as the server:

| Variable | Description |
| -------- | ----------- |
| `NETWORK` | `mainnet` (default) or `testnet` |
| `MNEMONIC` | 24-word mnemonic for single-wallet mode |
| `PRIVATE_KEY` | Hex-encoded private key (alternative to mnemonic) |
| `WALLET_VERSION` | `v5r1` (default), `v4r2`, or `agentic` |
| `TONCENTER_API_KEY` | Optional Toncenter API key |
| `TON_CONFIG_PATH` | Path to config file (default: `~/.config/ton/config.json`) |

Without `MNEMONIC` or `PRIVATE_KEY`, the CLI uses the local config registry at `~/.config/ton/config.json` (registry mode). In registry mode, wallet-scoped tools accept an optional `--walletSelector` to target a specific wallet by id, name, or address.

## Tool Reference

### Wallet & Balance

| Tool | Required args | Optional args |
| ---- | ------------- | ------------- |
| `get_wallet` | — | `--walletSelector` |
| `get_balance` | — | `--walletSelector` |
| `get_balance_by_address` | `--address` | `--walletSelector` |
| `get_jetton_balance` | `--jettonAddress` | `--walletSelector` |
| `get_jettons` | — | `--walletSelector` |
| `get_jettons_by_address` | `--address` | `--limit`, `--offset`, `--walletSelector` |
| `get_jetton_info` | `--jettonAddress` | `--walletSelector` |
| `get_transactions` | — | `--limit`, `--walletSelector` |
| `get_transaction_status` | `--normalizedHash` | `--walletSelector` |
| `get_known_jettons` | — | — |

### Wallet Registry (config-registry mode only)

| Tool | Required args | Optional args |
| ---- | ------------- | ------------- |
| `list_wallets` | — | — |
| `get_current_wallet` | — | — |
| `set_active_wallet` | `--walletSelector` | — |
| `remove_wallet` | `--walletSelector` | — |

### Transfers

| Tool | Required args | Optional args |
| ---- | ------------- | ------------- |
| `send_ton` | `--toAddress`, `--amount` | `--comment`, `--walletSelector` |
| `send_jetton` | `--toAddress`, `--jettonAddress`, `--amount` | `--comment`, `--walletSelector` |
| `send_nft` | `--nftAddress`, `--toAddress` | `--comment`, `--walletSelector` |
| `send_raw_transaction` | `--messages` | `--validUntil`, `--fromAddress`, `--walletSelector` |
| `emulate_transaction` | `--messages` | `--validUntil`, `--walletSelector` |

### Swaps

| Tool | Required args | Optional args |
| ---- | ------------- | ------------- |
| `get_swap_quote` | `--fromToken`, `--toToken`, `--amount` | `--slippageBps`, `--walletSelector` |

### NFTs

| Tool | Required args | Optional args |
| ---- | ------------- | ------------- |
| `get_nfts` | — | `--limit`, `--offset`, `--walletSelector` |
| `get_nfts_by_address` | `--address` | `--limit`, `--offset`, `--walletSelector` |
| `get_nft` | `--nftAddress` | `--walletSelector` |

### DNS

| Tool | Required args | Optional args |
| ---- | ------------- | ------------- |
| `resolve_dns` | `--domain` | `--walletSelector` |
| `back_resolve_dns` | `--address` | `--walletSelector` |

## Example Session

```bash
# Check wallet address and network
npx @ton/mcp@alpha get_wallet

# Check TON balance
npx @ton/mcp@alpha get_balance

# List all tokens
npx @ton/mcp@alpha get_jettons

# Last 10 transactions
npx @ton/mcp@alpha get_transactions --limit 10

# Get balance of a specific jetton
npx @ton/mcp@alpha get_jetton_balance --jettonAddress EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs

# Resolve a .ton domain
npx @ton/mcp@alpha resolve_dns --domain foundation.ton

# In registry mode: check balances for a named wallet
npx @ton/mcp@alpha get_balance --walletSelector "my-hot-wallet"

# In registry mode: list all registered wallets
npx @ton/mcp@alpha list_wallets

# Send TON (always confirm with user first)
npx @ton/mcp@alpha send_ton --toAddress UQA... --amount 0.5 --comment "payment"

# Swap quote
npx @ton/mcp@alpha get_swap_quote --fromToken TON --toToken EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs --amount 1
```

## Notes

- Use `emulate_transaction` to dry-run any transaction before sending — it returns expected balance changes, fees, and high-level actions
- Always confirm with the user before running `send_ton`, `send_jetton`, `send_nft`, or `send_raw_transaction`;
- For confirmations and small option sets, prefer the host client's structured confirmation/choice UI when available; otherwise use a short natural-language yes/no prompt and never require an exact magic word;
- After sending, poll `get_transaction_status --normalizedHash <hash>` until status is `completed` or `failed` (unless the user asks to skip).
- In registry mode the active wallet from `~/.config/ton/config.json` is used by default.
