# @ton/mcp - TON MCP Server

A Model Context Protocol (MCP) server for TON blockchain wallet operations. Built on top of `@ton/walletkit`.

## Features

- **Wallet Management**: Create, import, list, and remove TON wallets
- **Balance Queries**: Check TON and Jetton balances
- **Transfers**: Send TON and Jettons to any address
- **Swaps**: Get quotes and execute token swaps
- **Dual Transport**: Stdio (default) and HTTP server modes

## Quick Start

```bash
# Run as stdio MCP server
npx @ton/mcp

# Run as HTTP server (port 3000)
npx @ton/mcp --http

# Run as HTTP server on custom port
npx @ton/mcp --http 8080
```

## Usage with MCP Clients

### Claude Desktop / Cursor

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "ton": {
      "command": "npx",
      "args": ["@ton/mcp"]
    }
  }
}
```

### HTTP mode

Start the server and point your MCP client to the endpoint:

```bash
npx @ton/mcp --http 3000
# MCP endpoint: http://localhost:3000/mcp
```

## Environment Variables

| Variable  | Default   | Description                  |
|-----------|-----------|------------------------------|
| `NETWORK` | `mainnet` | TON network (`mainnet` / `testnet`) |

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

### Swaps

#### `get_swap_quote`
Get a quote for a token swap.

#### `execute_swap`
Execute a token swap.

## Development

```bash
# Run from source (stdio)
pnpm --filter @ton/mcp dev:cli

# Run from source (HTTP)
pnpm --filter @ton/mcp dev:cli:http

# Build
pnpm --filter @ton/mcp build

# Run built version
node packages/mcp/dist/cli.js
node packages/mcp/dist/cli.js --http 8080
```

## Library Usage

The package also exports a programmatic API for building custom MCP servers:

```typescript
import { createTonWalletMCP, InMemoryStorageAdapter, LocalSignerAdapter, StaticUserContextProvider } from '@ton/mcp';

const server = createTonWalletMCP({
  storage: new InMemoryStorageAdapter(),
  signer: new LocalSignerAdapter(),
  userContext: new StaticUserContextProvider('my-user'),
  network: 'mainnet',
  requireConfirmation: false,
});
```

## License

MIT
