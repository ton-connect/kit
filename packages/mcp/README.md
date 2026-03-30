# @ton/mcp - TON MCP Server

A Model Context Protocol (MCP) server for TON blockchain wallet operations. Built on top of `@ton/walletkit`.

## Features

- **Balance Queries**: Check TON and Jetton balances, view transaction history.
- **Transfers**: Send TON, Jettons, and NFTs to any address.
- **Swaps**: Get quotes for token swaps via DEX aggregators.
- **NFTs**: List, inspect, and transfer NFTs.
- **DNS**: Resolve TON DNS-compatible domains and reverse-lookup addresses.
- **Known Jettons**: Built-in directory of popular tokens.
- **Agentic Wallets**: Manage agentic wallets. Create, import, or manage your agentic wallets.
- **Multiple Transports**: Stdio (default), multi-session HTTP server, and serverless modes.

## Quick Start

`@ton/mcp` supports two runtime modes.

- **Agentic Wallets mode**: Server starts from local config registry at `~/.config/ton/config.json` or `TON_CONFIG_PATH`
- **Single-wallet mode**: if `MNEMONIC` or `PRIVATE_KEY` is set, the server starts with one in-memory wallet

Choose one control path per task: either run `@ton/mcp` as an MCP server (stdio or HTTP) or call tools through raw CLI. Agents must not mix MCP server mode and raw CLI against the same workflow/session, because that creates competing control paths over the same wallet/config state.

### Agentic Wallets mode

Self-custody wallets for autonomous agents. Your AI agent gets TON wallet capabilities — transfers, swaps, NFTs. User keeps the master key, agent keeps the operator key.

Key storage in this mode: wallet secrets are persisted inside the local config registry at `TON_CONFIG_PATH` or `~/.config/ton/config.json`. The config directory is created with `0700` permissions and the config file with `0600` permissions. The file is not stored as plain text, but the current protected-file format is only obfuscation-in-file, not real cryptographic protection with an external secret or password.

**Learn more about [Agentic Wallets](https://agents.ton.org/).**

Agentic Wallets mode is the default mode that allows you to manage agentic wallets. To create your first agentic wallet, ask your agent to `create agentic wallet` and follow the instructions.

```bash
# Install skills (recommended)
npx skills add ton-connect/kit/packages/mcp

# Run as stdio MCP server in agentic mode
npx @ton/mcp@alpha

# Run as HTTP server in agentic mode
npx @ton/mcp@alpha --http

# Run in registry mode with a custom config path
TON_CONFIG_PATH=/path/to/config.json npx @ton/mcp@alpha
```

### Single-wallet mode

Single-wallet mode is a mode where the server starts with one in-memory wallet. This mode is useful when you want to manage a single wallet or when you want to use the server for a one-off task.

Key storage in this mode: `MNEMONIC` / `PRIVATE_KEY` are read from environment variables and used only in memory for the current process; `@ton/mcp` does not persist them to disk in this mode. The values come in as plain environment variables, so any non-plain-text storage or encryption is the responsibility of the caller or host environment, not `@ton/mcp`.

```bash
# Run as stdio MCP server with mnemonic
MNEMONIC="word1 word2 ..." npx @ton/mcp@alpha

# Run as HTTP server (port 3000)
MNEMONIC="word1 word2 ..." npx @ton/mcp@alpha --http

# Run as HTTP server on custom port and private key
PRIVATE_KEY="0xyour_private_key" npx @ton/mcp@alpha --http 8080
```

## Usage with MCP Clients

### Claude Desktop / Cursor

Agentic Wallets mode:

```json
{
  "mcpServers": {
    "ton": {
      "command": "npx",
      "args": ["-y", "@ton/mcp@alpha"],
      "env": {
        "// optional config path": "",
        "TON_CONFIG_PATH": "/absolute/path/to/config.json"
      }
    }
  }
}
```

Single-wallet mode:

```json
{
  "mcpServers": {
    "ton": {
      "command": "npx",
      "args": ["-y", "@ton/mcp@alpha"],
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
npx @ton/mcp@alpha --http 3000
# MCP endpoint: http://localhost:3000/mcp
```

HTTP mode keeps a separate MCP session/transport per client session id, so multiple clients can initialize and reconnect independently.

## Usage Examples

Examples of user requests, approximate corresponding raw CLI commands via `npx @ton/mcp@alpha`, and expected agent responses are collected in [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md).

## Environment Variables

| Variable | Default | Description |
|-------------------|-----------|-------------------------------------------------------|
| `NETWORK` | `mainnet` | TON network (`mainnet` / `testnet`) and default env override target for `TONCENTER_API_KEY` |
| `MNEMONIC` |  | Space-separated 24-word mnemonic phrase for single-wallet mode |
| `PRIVATE_KEY` |  | Hex-encoded private key: 32-byte or 64-byte (alternative to mnemonic) |
| `WALLET_VERSION` | `v5r1` | Wallet version to use in single-wallet mode (`v5r1`, `v4r2`, or `agentic`) |
| `AGENTIC_WALLET_ADDRESS` |  | Agentic wallet address (required for `WALLET_VERSION=agentic`, unless derived from init params) |
| `AGENTIC_WALLET_NFT_INDEX` |  | Agentic wallet NFT index (`uint256`, optional) |
| `AGENTIC_COLLECTION_ADDRESS` | `EQByQ19qvWxW7VibSbGEgZiYMqilHY5y1a_eeSL2VaXhfy07` | Agentic collection address override for single-wallet mode |
| `TONCENTER_API_KEY` |  | API key for Toncenter (optional, for higher rate limits) |
| `TON_CONFIG_PATH` | `~/.config/ton/config.json` | Config path for registry mode |
| `AGENTIC_CALLBACK_BASE_URL` |  | Optional public base URL for agentic onboarding callbacks |
| `AGENTIC_CALLBACK_HOST` | `127.0.0.1` | Host for the local callback server in stdio mode |
| `AGENTIC_CALLBACK_PORT` | random free port | Port for the local callback server in stdio mode |

## Available Tools

In registry mode, wallet-scoped tools below also accept optional `walletSelector`. If omitted, the active wallet is used.

### Wallet Info

#### `get_wallet`
Get the current wallet address and network information.

**Returns:** Wallet address and network (`mainnet` or `testnet`)

#### `list_wallets` (registry mode only)
List all wallets stored in the local TON config registry.

#### `get_current_wallet` (registry mode only)
Get the currently active wallet from the local TON config registry.

#### `set_active_wallet` (registry mode only)
Set the active wallet by id, name, or address.

**Parameters:**
- `walletSelector` (required): Wallet id, name, or address

#### `remove_wallet` (registry mode only)
Soft-delete a stored wallet from the local registry. Removed wallets remain in the config file but are hidden from MCP listings and wallet selection.

**Parameters:**
- `walletSelector` (required): Wallet id, name, or address

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
Send TON to an address. Amount is in human-readable format (e.g., `"1.5"` means 1.5 TON). Returns top-level `normalizedHash`. Default flow: poll `get_transaction_status` until completed or failed; user can skip.

**Parameters:**
- `toAddress` (required): Recipient TON address
- `amount` (required): Amount in TON (e.g., `"1.5"`)
- `comment` (optional): Transaction comment/memo

#### `send_jetton`
Send Jettons to an address. Amount is in human-readable format. Returns top-level `normalizedHash`. Default flow: poll `get_transaction_status` until completed or failed; user can skip.

**Parameters:**
- `toAddress` (required): Recipient TON address
- `jettonAddress` (required): Jetton master contract address
- `amount` (required): Amount in human-readable format (e.g., `"100"`)
- `comment` (optional): Transaction comment/memo

#### `send_raw_transaction`
Send a raw transaction with full control over messages. Supports multiple messages. Returns top-level `normalizedHash`. Default flow: poll `get_transaction_status` until completed or failed; user can skip.

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
Resolve a TON DNS-compatible domain name (e.g., `"foundation.ton"` or `"viqex.t.me"`) to a wallet address.

**Parameters:**
- `domain` (required): TON DNS domain to resolve

#### `back_resolve_dns`
Reverse-resolve a TON wallet address to its associated DNS domain when available.

**Parameters:**
- `address` (required): TON wallet address to reverse resolve

### Utility

#### `get_known_jettons`
Get a list of known/popular Jettons on TON with their addresses and metadata. Useful for looking up token addresses for swaps or transfers.

#### `agentic_validate_wallet` (registry mode only)
Validate an existing agentic wallet address against the expected network and collection.

**Parameters:**
- `address` (required): Agentic wallet address
- `network` (optional): Network to validate against
- `collectionAddress` (optional): Collection address override
- `ownerAddress` (optional): Expected owner address

#### `agentic_list_wallets_by_owner` (registry mode only)
List agentic wallets owned by a given main wallet address.

**Parameters:**
- `ownerAddress` (required): Owner wallet address
- `network` (optional): Network to query

#### `agentic_import_wallet` (registry mode only)
Import an existing agentic wallet into the local TON config registry, recovering a matching pending key draft when available. Otherwise the wallet is imported read-only until `agentic_rotate_operator_key` is completed.

**Parameters:**
- `address` (required): Agentic wallet address
- `network` (optional): Network to validate against
- `name` (optional): Wallet display name

#### `agentic_start_root_wallet_setup` (registry mode only)
Start first-root-agent setup: generate operator keys, persist a pending draft, and return a dashboard URL for the user to create the wallet from their main wallet. Agents with local shell/browser access should open the dashboard URL for the user. Callback-based completion is for long-lived stdio/HTTP server sessions; raw CLI should use manual completion.

**Parameters:**
- `network` (optional): Network for the new root wallet
- `name` (optional): Agent display name
- `source` (optional): Source or description
- `collectionAddress` (optional): Collection address override
- `tonDeposit` (optional): TON deposit hint for the dashboard

Pending onboarding callback state is persisted in the local config, so the setup can be resumed after MCP transport restarts. In HTTP mode, callback URLs are stable on the MCP server base URL. In stdio mode, use `AGENTIC_CALLBACK_BASE_URL` and/or `AGENTIC_CALLBACK_PORT` if you need a fixed callback endpoint across restarts.

#### `agentic_list_pending_root_wallet_setups` (registry mode only)
List pending root-agent onboarding drafts and their callback/session status.

#### `agentic_get_root_wallet_setup` (registry mode only)
Get one pending root-agent onboarding draft by setup id.

**Parameters:**
- `setupId` (required): Pending setup identifier

#### `agentic_complete_root_wallet_setup` (registry mode only)
Complete root-agent onboarding from callback payload or manually supplied wallet address, then import the resulting wallet and make it active.

**Parameters:**
- `setupId` (required): Pending setup identifier
- `walletAddress` (optional): Manual wallet address if no callback was received
- `ownerAddress` (optional): Owner address hint for validation

#### `agentic_cancel_root_wallet_setup` (registry mode only)
Cancel a pending root-agent onboarding draft and remove its pending state.

**Parameters:**
- `setupId` (required): Pending setup identifier

## Serverless Deployment

The package exports a `@ton/mcp/serverless` entry point for deploying as a serverless function (AWS Lambda, Vercel, Cloudflare Workers, etc.). Credentials are passed via request headers instead of environment variables.

By design, serverless mode:

- operates in single-wallet mode only
- does not use the wallet registry
- does not expose wallet management and onboarding tools
- uses standard `v5r1` wallet type

### Headers

| Header          | Description                                              |
|-----------------|----------------------------------------------------------|
| `MNEMONIC`      | 24-word mnemonic phrase                                  |
| `PRIVATE_KEY`   | Hex-encoded private key: 32-byte seed or 64-byte (takes priority over `MNEMONIC`) |
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

# Checks
pnpm --filter @ton/mcp test
pnpm --filter @ton/mcp typecheck

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

The same factory also supports registry mode:

```typescript
import { createTonWalletMCP } from '@ton/mcp';

const server = await createTonWalletMCP({
  networks: {
    mainnet: { apiKey: process.env.TONCENTER_API_KEY },
  },
});
```

## License

MIT
