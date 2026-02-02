# TON MCP CLI

Command-line MCP server for TON wallet management. This CLI runs a Model Context Protocol server that provides TON wallet tools for use with Claude Desktop or other MCP clients.

## Features

- Create and import TON wallets
- Check TON and Jetton balances
- Send TON and Jettons
- Swap tokens via STON.fi (Omniston)

## Installation

```bash
# From the monorepo root
pnpm install
pnpm --filter @ton/mcp-cli build
```

## Usage

### With Claude Desktop

Add to your Claude Desktop configuration (`claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "ton-wallet": {
      "command": "node",
      "args": ["/path/to/ton-connect/kit/apps/mcp-cli/dist/index.js"]
    }
  }
}
```

### Development

```bash
# Run in development mode (with tsx)
pnpm --filter @ton/mcp-cli dev

# Build and run
pnpm --filter @ton/mcp-cli build
pnpm --filter @ton/mcp-cli start
```

## Available Tools

| Tool | Description |
|------|-------------|
| `create_wallet` | Create a new TON wallet |
| `import_wallet` | Import wallet from 24-word mnemonic |
| `list_wallets` | List all stored wallets |
| `remove_wallet` | Remove a wallet |
| `get_balance` | Get TON balance |
| `get_jetton_balance` | Get specific Jetton balance |
| `get_jettons` | List all Jettons in wallet |
| `send_ton` | Send TON to an address |
| `send_jetton` | Send Jettons to an address |
| `get_swap_quote` | Get swap quote from STON.fi |
| `execute_swap` | Execute a token swap |

## Notes

- This CLI uses in-memory storage, so wallets are not persisted between restarts
- Wallets are stored securely using the local signer adapter
- For production use, consider implementing persistent storage adapters

## License

MIT
