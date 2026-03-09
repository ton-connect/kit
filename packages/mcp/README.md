# @ton/mcp - TON MCP Server

A Model Context Protocol (MCP) server for TON blockchain wallet operations. Built on top of `@ton/walletkit`.

## Features

- **Balance Queries**: Check TON and Jetton balances, view transaction history
- **Transfers**: Send TON, Jettons, and NFTs to any address
- **Agentic Sub-wallet Deploy**: Deploy additional Agentic wallets from a root Agentic wallet
- **Swaps**: Get quotes for token swaps via DEX aggregators
- **NFTs**: List, inspect, and transfer NFTs
- **DNS**: Resolve `.ton` domains and reverse-lookup addresses
- **Known Jettons**: Built-in directory of popular tokens
- **Multiple Transports**: Stdio (default), HTTP server, and serverless modes

## Quick Start

> **Note:** We currently do not support launch without a mnemonic or private key.

```bash
# Run as stdio MCP server
MNEMONIC="word1 word2 ..." npx @ton/mcp

# Run as HTTP server (port 3000)
MNEMONIC="word1 word2 ..." npx @ton/mcp --http

# Run as HTTP server on custom port
MNEMONIC="word1 word2 ..." npx @ton/mcp --http 8080

# Run with custom agentic wallet contract
PRIVATE_KEY="0xyour_private_key" \
WALLET_VERSION="agentic" \
AGENTIC_WALLET_ADDRESS="EQ..." \
npx @ton/mcp
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
| `PRIVATE_KEY`     |           | Hex-encoded private key: 32-byte seed or 64-byte `private||public` (alternative to mnemonic) |
| `WALLET_VERSION`  | `v5r1`    | Wallet version to use (`v5r1`, `v4r2`, or `agentic`)  |
| `AGENTIC_WALLET_ADDRESS` |   | Agentic wallet address (required for `WALLET_VERSION=agentic`, unless derived from init params) |
| `AGENTIC_WALLET_NFT_INDEX` | | Agentic wallet NFT index / subwallet id (`uint256`, optional) |
| `AGENTIC_COLLECTION_ADDRESS` | | Agentic collection address (optional, used with NFT index to derive state init/address) |
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

#### `get_balance_by_address`
Get the TON balance of any address.

**Parameters:**
- `address` (required): TON wallet address

**Returns:** Address balance in TON and nanoTON

#### `get_jetton_balance`
Get the balance of a specific Jetton in the wallet.

**Parameters:**
- `jettonAddress` (required): Jetton master contract address

#### `get_jettons`
List all Jettons held by the wallet with balances and metadata.

#### `get_jettons_by_address`
List Jettons held by any address with balances and metadata.

**Parameters:**
- `address` (required): Owner wallet address
- `limit` (optional): Maximum number of jettons to return (default: 20, max: 100)
- `offset` (optional): Offset for pagination (default: 0)

#### `get_jetton_info`
Get metadata for a Jetton master contract.

**Parameters:**
- `address` (required): Jetton master contract address

#### `get_jetton_wallet_address`
Get the jetton-wallet address for a given Jetton master and owner address.

**Parameters:**
- `jettonAddress` (required): Jetton master contract address
- `ownerAddress` (required): Owner wallet address

#### `get_transactions`
Get recent transaction history for the wallet (TON transfers, Jetton transfers, swaps, etc.).

**Parameters:**
- `limit` (optional): Maximum number of transactions to return (default: 20, max: 100)

#### `get_transaction_status`
Get the status of a transaction by its normalized hash to know if it is pending, completed, or failed. In TON, a transaction is considered "complete" only when the entire trace finishes processing.

**Default flow:** After sending a transaction, poll this until status is completed or failed. User can specify whether to check status.

**Parameters:**
- `normalizedHash` (required): Normalized hash of the external-in transaction (Hex string). Note: This must be the *normalized* hash of the message sent to the network.

### Transfers

#### `send_ton`
Send TON to an address. Amount is in human-readable format (e.g., `"1.5"` means 1.5 TON). Returns `normalizedHash`. Default flow: poll `get_transaction_status` until completed or failed; user can skip.

**Parameters:**
- `toAddress` (required): Recipient TON address
- `amount` (required): Amount in TON (e.g., `"1.5"`)
- `comment` (optional): Transaction comment/memo

#### `send_jetton`
Send Jettons to an address. Amount is in human-readable format. Returns `normalizedHash`. Default flow: poll `get_transaction_status` until completed or failed; user can skip.

**Parameters:**
- `toAddress` (required): Recipient TON address
- `jettonAddress` (required): Jetton master contract address
- `amount` (required): Amount in human-readable format (e.g., `"100"`)
- `comment` (optional): Transaction comment/memo

#### `send_raw_transaction`
Send a raw transaction with full control over messages. Supports multiple messages. Returns `normalizedHash`. Default flow: poll `get_transaction_status` until completed or failed; user can skip.

**Parameters:**
- `messages` (required): Array of messages, each with:
  - `address` (required): Recipient wallet address
  - `amount` (required): Amount in nanotons
  - `stateInit` (optional): Initial state for deploying a contract (Base64)
  - `payload` (optional): Message payload data (Base64)
- `validUntil` (optional): Unix timestamp after which the transaction becomes invalid
- `fromAddress` (optional): Sender wallet address

#### `deploy_agentic_subwallet`
Deploy a new Agentic sub-wallet from the current wallet. Works only with `WALLET_VERSION=agentic` and only when the current wallet is a user-root wallet (`deployedByUser=true`). Returns `normalizedHash`, deployed sub-wallet address, and computed sub-wallet NFT index.
NFT metadata is written in onchain TEP-64 format.

**Default flow:** Poll `get_transaction_status` with the returned `normalizedHash` until completion.

**Parameters:**
- `operatorPublicKey` (required): New sub-wallet operator public key (`uint256`, decimal or `0x`-prefixed hex)
- `metadata` (required): Onchain TEP-64 metadata object. Must include at least `name` (non-empty string).
- `amountTon` (optional): TON amount to attach for deployment in TON units (default: `"0.05"`)

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

#### `get_nfts_by_address`
List NFTs held by any address with metadata, collection info, and attributes.

**Parameters:**
- `address` (required): Owner wallet address
- `limit` (optional): Maximum number of NFTs to return (default: 20, max: 100)
- `offset` (optional): Offset for pagination (default: 0)

#### `get_nft`
Get detailed information about a specific NFT by its address.

**Parameters:**
- `nftAddress` (required): NFT item contract address

#### `send_nft`
Transfer an NFT from the wallet to another address. Returns `normalizedHash`. Default flow: poll `get_transaction_status` until completed or failed; user can skip.

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

## Serverless Deployment

The package exports a `@ton/mcp/serverless` entry point for deploying as a serverless function (AWS Lambda, Vercel, Cloudflare Workers, etc.). Credentials are passed via request headers instead of environment variables.

### Headers

| Header          | Description                                              |
|-----------------|----------------------------------------------------------|
| `MNEMONIC`      | 24-word mnemonic phrase                                  |
| `PRIVATE_KEY`   | Hex-encoded private key: 32-byte seed or 64-byte `private||public` (takes priority over `MNEMONIC`) |
| `NETWORK`       | `mainnet` (default) or `testnet`                         |
| `TONCENTER_KEY` | Optional TonCenter API key for higher rate limits        |

### AWS Lambda

```typescript
import { createServerlessHandler } from '@ton/mcp/serverless';

export const handler = createServerlessHandler();
```

### Vercel

```typescript
import { createServerlessHandler } from '@ton/mcp/serverless';

export default createServerlessHandler();
```

### Custom Integration

```typescript
import { createServerlessHandler } from '@ton/mcp/serverless';

const handle = createServerlessHandler();

const response = await handle({
  method: 'POST',
  url: '/mcp',
  headers: {
    'MNEMONIC': 'word1 word2 word3 ...',
    'NETWORK': 'mainnet',
  },
  body: mcpRequestBody,
});
```

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
