# TON CLI - Blockchain Wallet Toolkit

Command-line tool for TON blockchain wallet operations. Works as both a human-friendly CLI and agent-friendly JSON API.

## When to Use

Use this skill when the user wants to:
- Check wallet info, TON or token balances
- Send TON, Jettons (tokens), or NFTs
- Swap tokens on DEX
- View transaction history
- Resolve .ton domains

## Installation

```bash
npx @ton/cli <command>
```

## Setup

Configure credentials (checked in this order):
1. CLI flags: `--mnemonic "..."` or `--private-key 0x...`
2. Environment variables: `MNEMONIC` or `PRIVATE_KEY`
3. Config file: `~/.config/ton/config.json` (created by `ton setup`)

```bash
ton setup                          # Interactive wizard
ton wallet import --mnemonic "..." # Import directly
```

## Commands

### Wallet & Balance
- `ton wallet` - Get wallet address and network info
- `ton balance` - Get TON balance
- `ton balance jetton <addr>` - Get specific token balance
- `ton jettons` - List all tokens in wallet
- `ton jettons known` - Get list of popular tokens with addresses (no wallet needed)
- `ton transactions` - View recent transactions (optional `--limit N`)

### Transfers
- `ton send ton <to> <amount>` - Send TON (amount in TON like "1.5")
- `ton send jetton <to> <jetton> <amount>` - Send tokens
- `ton nft send <nft> <to>` - Transfer NFT
- `ton send raw --messages '<json>'` - Advanced: send raw transaction

### Swaps
- `ton swap quote <from> <to> <amount>` - Get swap quote
  - Use "TON" or jetton address for tokens
  - Returns transaction params for `ton send raw`

### NFTs
- `ton nft list` - List wallet NFTs (optional `--limit`, `--offset`)
- `ton nft get <addr>` - Get NFT details

### DNS
- `ton dns resolve <domain>` - Resolve .ton domain to address
- `ton dns reverse <address>` - Find domain for address

### Management
- `ton setup` - Interactive setup wizard
- `ton shell` - Interactive REPL mode
- `ton wallet show` - Show current configuration
- `ton wallet import` - Import credentials
- `ton wallet reset` - Delete stored config

## Agent-Friendly Usage

Add `--json` to any command for structured JSON output:

```bash
ton balance --json
ton jettons --json
ton send ton UQ... 1.5 --json
```

JSON output goes to stdout, errors include `{"success": false, "error": "..."}`.
Exit code 0 = success, 1 = error.

## Common Workflows

### Check Balance
1. `ton wallet` for address and network
2. `ton balance` for TON
3. `ton jettons` for all tokens

### Send TON
1. If user provides .ton domain, `ton dns resolve <domain>` first
2. `ton send ton <address> <amount>`

### Swap Tokens
1. `ton jettons known` if user mentions token by name
2. `ton swap quote <from> <to> <amount>` to get quote
3. Show quote to user and ask for confirmation
4. `ton send raw --messages '<transaction JSON>'` to execute

## Notes

- Amounts for `send ton`, `send jetton`, and `swap quote` are human-readable (e.g., "1.5" = 1.5 TON)
- Always confirm with user before executing transfers or swaps
- Use `--network testnet` for testing
