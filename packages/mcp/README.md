# @ton/mcp - TON MCP Server

A Model Context Protocol (MCP) server for TON blockchain wallet operations. Built on top of `@ton/walletkit`.

## Features

- **Wallet Management**: Create, import, list, and remove TON wallets
- **Balance Queries**: Check TON and Jetton balances
- **Transfers**: Send TON and Jettons to any address
- **Secure Storage**: Wallets stored locally with encryption-ready design

## Installation

```bash
# In the monorepo
pnpm install
pnpm --filter @ton/mcp build
```

## Usage with MCP Clients

### Claude Desktop / Cursor

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "ton": {
      "command": "node",
      "args": ["/path/to/kit/apps/mcp/dist/index.js"]
    }
  }
}
```

## Available Tools

### Wallet Management

#### `create_wallet`
Create a new TON wallet with a generated 24-word mnemonic.

**Parameters:**
- `name` (required): Unique name for the wallet
- `version` (optional): Wallet version - `v5r1` (default, recommended) or `v4r2`

**Returns:** Wallet address and mnemonic (save securely!)

#### `import_wallet`
Import an existing wallet using a mnemonic phrase.

**Parameters:**
- `name` (required): Unique name for the wallet
- `mnemonic` (required): 24-word mnemonic phrase (space-separated)
- `version` (optional): Wallet version - `v5r1` (default) or `v4r2`

#### `list_wallets`
List all stored wallets with their addresses and metadata.

#### `remove_wallet`
Remove a wallet from storage.

**Parameters:**
- `name` (required): Name of the wallet to remove

### Balance Queries

#### `get_balance`
Get the TON balance for a wallet.

**Parameters:**
- `wallet` (required): Name of the wallet

**Returns:** Balance in nanoTON and TON

#### `get_jetton_balance`
Get the balance of a specific Jetton.

**Parameters:**
- `wallet` (required): Name of the wallet
- `jettonAddress` (required): Jetton master contract address

#### `get_jettons`
List all Jettons held by a wallet.

**Parameters:**
- `wallet` (required): Name of the wallet

### Transfers

#### `send_ton`
Send TON to an address.

**Parameters:**
- `wallet` (required): Name of the wallet to send from
- `toAddress` (required): Recipient TON address
- `amount` (required): Amount in nanoTON (1 TON = 1,000,000,000 nanoTON)
- `comment` (optional): Transaction comment/memo

#### `send_jetton`
Send Jettons to an address.

**Parameters:**
- `wallet` (required): Name of the wallet to send from
- `toAddress` (required): Recipient TON address
- `jettonAddress` (required): Jetton master contract address
- `amount` (required): Amount in raw units (apply decimals yourself)
- `comment` (optional): Transaction comment/memo

## Storage

Wallet data is stored in `~/.ton-mcp/wallets.json`.

**Current Implementation:** Plaintext JSON storage

**Security Note:** Mnemonics are currently stored in plaintext. The storage interface is designed to easily support encrypted storage in the future. Do not use this for production wallets with significant funds until encryption is implemented.

## Development

```bash
# Build
pnpm build

# Watch mode
pnpm dev

# Run directly
pnpm start
```

## Network

The server uses TON Mainnet by default. This can be configured in the WalletService constructor.

## License

MIT



