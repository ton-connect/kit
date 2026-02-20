# @ton/mcp - TON MCP Server

A Model Context Protocol (MCP) server for TON blockchain wallet operations. Built on top of `@ton/walletkit`.

## Features

- **Balance Queries**: Check TON and Jetton balances, view transaction history
- **Transfers**: Send TON, Jettons, and NFTs to any address
- **Swaps**: Get quotes for token swaps via DEX aggregators
- **NFTs**: List, inspect, and transfer NFTs
- **DNS**: Resolve `.ton` domains and reverse-lookup addresses
- **Known Jettons**: Built-in directory of popular tokens
- **Dual Transport**: Stdio (default) and HTTP server modes

## Quick Start

> **Note:** We currently do not support launch without a mnemonic or private key.

```bash
# Run as stdio MCP server
MNEMONIC="word1 word2 ..." npx @ton/mcp

# Run as HTTP server (port 3000)
MNEMONIC="word1 word2 ..." npx @ton/mcp --http

# Run as HTTP server on custom port
MNEMONIC="word1 word2 ..." npx @ton/mcp --http 8080
```

## Usage with MCP Clients

### Claude Desktop / Cursor

Add to your MCP configuration:

```json
{
  "mcpServers": {
    "ton": {
      "command": "npx",
      "args": ["-y", "@ton/mcp"],
      "env": {
        "MNEMONIC": "word1 word2 word3 ...",
        "PRIVATE_KEY": "0xyour_private_key_here (optional, alternative to MNEMONIC)"
      }
    }
  }
}
```

### HTTP mode

Start the server and point your MCP client to the endpoint:

```bash
MNEMONIC="word1 word2 ..." npx @ton/mcp --http 3000
# MCP endpoint: http://localhost:3000/mcp
```

## Environment Variables

| Variable          | Default   | Description                                           |
|-------------------|-----------|-------------------------------------------------------|
| `NETWORK`         | `mainnet` | TON network (`mainnet` / `testnet`)                   |
| `MNEMONIC`        |           | Space-separated 24-word mnemonic phrase for wallet    |
| `PRIVATE_KEY`     |           | Hex-encoded private key (alternative to mnemonic)     |
| `WALLET_VERSION`  | `v5r1`    | Wallet version to use (`v5r1` or `v4r2`)              |
| `TONCENTER_API_KEY`|          | API key for Toncenter (optional, for higher rate limits)|

## Available Tools

### Wallet Info

#### `get_wallet`
Get the current wallet address and network information.

**Returns:** Wallet address and network (`mainnet` or `testnet`)

### Balance & History

#### `get_balance`
Get the TON balance of the wallet.

**Returns:** Balance in TON and nanoTON

#### `get_jetton_balance`
Get the balance of a specific Jetton in the wallet.

**Parameters:**
- `jettonAddress` (required): Jetton master contract address

#### `get_jettons`
List all Jettons held by the wallet with balances and metadata.

#### `get_transactions`
Get recent transaction history for the wallet (TON transfers, Jetton transfers, swaps, etc.).

**Parameters:**
- `limit` (optional): Maximum number of transactions to return (default: 20, max: 100)

### Transfers

#### `send_ton`
Send TON to an address. Amount is in human-readable format (e.g., `"1.5"` means 1.5 TON).

**Parameters:**
- `toAddress` (required): Recipient TON address
- `amount` (required): Amount in TON (e.g., `"1.5"`)
- `comment` (optional): Transaction comment/memo

#### `send_jetton`
Send Jettons to an address. Amount is in human-readable format.

**Parameters:**
- `toAddress` (required): Recipient TON address
- `jettonAddress` (required): Jetton master contract address
- `amount` (required): Amount in human-readable format (e.g., `"100"`)
- `comment` (optional): Transaction comment/memo

#### `send_raw_transaction`
Send a raw transaction with full control over messages. Supports multiple messages in a single transaction.

**Parameters:**
- `messages` (required): Array of messages, each with:
  - `address` (required): Recipient wallet address
  - `amount` (required): Amount in nanotons
  - `stateInit` (optional): Initial state for deploying a contract (Base64)
  - `payload` (optional): Message payload data (Base64)
- `validUntil` (optional): Unix timestamp after which the transaction becomes invalid
- `fromAddress` (optional): Sender wallet address

### Swaps

#### `get_swap_quote`
Get a quote for swapping tokens. Returns quote details and transaction params that can be executed via `send_raw_transaction`.

**Parameters:**
- `fromToken` (required): Token to swap from (`"TON"` or jetton address)
- `toToken` (required): Token to swap to (`"TON"` or jetton address)
- `amount` (required): Amount in human-readable format (e.g., `"1.5"` for 1.5 TON)
- `slippageBps` (optional): Slippage tolerance in basis points (default: 100 = 1%)

### NFTs

#### `get_nfts`
List all NFTs in the wallet with metadata, collection info, and attributes.

**Parameters:**
- `limit` (optional): Maximum number of NFTs to return (default: 20, max: 100)
- `offset` (optional): Offset for pagination (default: 0)

#### `get_nft`
Get detailed information about a specific NFT by its address.

**Parameters:**
- `nftAddress` (required): NFT item contract address

#### `send_nft`
Transfer an NFT from the wallet to another address.

**Parameters:**
- `nftAddress` (required): NFT item contract address to transfer
- `toAddress` (required): Recipient TON address
- `comment` (optional): Transaction comment/memo

### DNS

#### `resolve_dns`
Resolve a TON DNS domain (e.g., `"foundation.ton"`) to a wallet address.

**Parameters:**
- `domain` (required): TON DNS domain to resolve

#### `back_resolve_dns`
Reverse-resolve a TON wallet address to its `.ton` domain.

**Parameters:**
- `address` (required): TON wallet address to reverse resolve

### Utility

#### `get_known_jettons`
Get a list of known/popular Jettons on TON with their addresses and metadata. Useful for looking up token addresses for swaps or transfers.

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
import { createTonWalletMCP } from '@ton/mcp';
import { Signer, WalletV5R1Adapter, TonWalletKit, MemoryStorageAdapter, Network } from '@ton/walletkit';

// Initialize TonWalletKit
const network = Network.mainnet();
const kit = new TonWalletKit({
  networks: { [network.chainId]: {} },
  storage: new MemoryStorageAdapter(),
});
await kit.waitForReady();

// Create wallet from mnemonic
const signer = await Signer.fromMnemonic(mnemonic, { type: 'ton' });
const walletAdapter = await WalletV5R1Adapter.create(signer, {
  client: kit.getApiClient(network),
  network,
});
const wallet = await kit.addWallet(walletAdapter);

// Create MCP server
const server = await createTonWalletMCP({ wallet });
```

## License

MIT
