# @ton/cli

Agent-friendly command-line wallet toolkit for the TON blockchain. Beautiful colored output for humans, structured JSON for AI agents and scripts.

## Quick Start

```bash
# Browse without setup
npx @ton/cli jettons known

# Setup your wallet
npx @ton/cli setup

# Check balance
npx @ton/cli balance

# Send TON
npx @ton/cli send ton UQBx...3kF 1.5
```

## Installation

```bash
# Run directly
npx @ton/cli <command>

# Or install globally
npm install -g @ton/cli
ton balance
```

## Credentials

The CLI checks credentials in this order:

1. **CLI flags** (highest priority): `--mnemonic "word1 word2 ..."` or `--private-key 0xabc...`
2. **Environment variables**: `MNEMONIC` or `PRIVATE_KEY`
3. **Config file** (lowest priority): `~/.config/ton/config.json`

### Setup Wizard

```bash
ton setup
```

Interactive wizard that walks you through configuring your wallet. Saves to `~/.config/ton/config.json`.

### Manual Import

```bash
ton wallet import --mnemonic "word1 word2 ... word24"
ton wallet import --private-key 0xabc123...
```

### Environment Variables

```bash
export MNEMONIC="word1 word2 ... word24"
export NETWORK=mainnet
export WALLET_VERSION=v5r1
export TONCENTER_API_KEY=your-key
```

## Commands

### Wallet Info

```bash
ton wallet                    # Show address and network
ton wallet show               # Show configuration details
ton wallet reset              # Delete stored config
ton wallet reset --force      # Delete without confirmation
```

### Balance

```bash
ton balance                   # TON balance
ton balance jetton EQCx...    # Specific token balance
```

### Tokens

```bash
ton jettons                   # List all tokens in wallet
ton jettons known             # Popular tokens directory (no wallet needed)
```

### Transactions

```bash
ton transactions              # Last 20 transactions
ton transactions --limit 50   # Custom limit
```

### Send

```bash
ton send ton UQBx...3kF 1.5                     # Send TON
ton send ton UQBx...3kF 1.5 --comment "Payment" # With comment
ton send jetton UQ... EQCx... 100               # Send tokens
ton send raw --messages '{"messages":[...]}'     # Raw transaction
```

### Swap

```bash
ton swap quote TON EQCx... 1.5                   # TON -> Token quote
ton swap quote EQCx... TON 100                   # Token -> TON quote
ton swap quote EQCx... EQAv... 50                # Token -> Token quote
```

### NFTs

```bash
ton nft list                  # List NFTs
ton nft list --limit 50       # Custom limit
ton nft get EQ...             # NFT details
ton nft send EQ... UQ...      # Transfer NFT
```

### DNS

```bash
ton dns resolve foundation.ton  # Domain -> address
ton dns reverse UQBx...3kF     # Address -> domain
```

### Interactive Shell

```bash
ton shell
```

Opens an interactive REPL with command history. All commands work without the `ton` prefix:

```
ton> balance
ton> send ton UQ... 1.5
ton> exit
```

## Agent-Friendly Output

Add `--json` to any command for structured JSON:

```bash
# Human output (default)
ton balance
# ● Balance
#   TON    1.500000000 TON (1500000000 nanoTON)

# Agent output
ton balance --json
# {"success":true,"address":"UQ...","balance":"1.5 TON","balanceNano":"1500000000"}
```

### For Scripts

```bash
# Pipe to jq
ton jettons --json | jq '.jettons[].symbol'

# Error handling
if ! result=$(ton balance --json 2>/dev/null); then
  echo "Failed to fetch balance"
fi
```

### Output Conventions

- `--json`: Structured JSON to stdout
- Human mode: Colored output to stdout, logs/spinners to stderr
- Exit code 0 = success, 1 = error
- Errors in JSON mode: `{"success": false, "error": "message"}`

## Global Flags

| Flag | Description |
|------|-------------|
| `--json` | JSON output (agent-friendly) |
| `--network mainnet\|testnet` | Override network |
| `--mnemonic "..."` | Provide mnemonic |
| `--private-key 0x...` | Provide private key |
| `--no-color` | Disable colors |
| `--help`, `-h` | Show help |
| `--version`, `-v` | Show version |

## License

MIT
