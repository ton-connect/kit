# AppKit Minter (Demo)

Web demo for [`@ton/appkit`](../../packages/appkit) and [`@ton/appkit-react`](../../packages/appkit-react) — an NFT minter plus playgrounds for jettons, NFTs, staking, and swap on the TON blockchain. Built with [Vite](https://vite.dev/), React, and Tailwind CSS.

## Requirements

- **Node.js** v18+
- **pnpm** — package manager

## Installation

```bash
# From the monorepo root
pnpm install

# Navigate to the app directory
cd apps/appkit-minter

# Start the dev server (http://localhost:5174)
pnpm dev
```

### Available Commands

| Command | Description |
|---------|-------------|
| `pnpm dev` | Start Vite dev server on port 5174 |
| `pnpm build` | Typecheck and produce a production build |
| `pnpm build:analyze` | Build with bundle analyzer |
| `pnpm preview` | Preview the production build |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm clean` | Clean cache, dist, and node_modules |

## Features

- **Mint NFT** — generate and mint NFTs from a customizable card template
- **Jettons** — browse and interact with jetton balances
- **NFTs** — view owned NFT collections and items
- **Staking** — stake TON via the [Tonstakers](https://tonstakers.com/) provider
- **Swap** — swap tokens via [Omniston](https://omniston.com/) and [DeDust](https://dedust.io/) providers
- **TON Connect** — connect to wallets via the TON Connect protocol
- **Networks** — switch between mainnet, testnet, and tetra

## Configuration

The app reads optional API keys from `.env` (Vite-style `VITE_*` variables):

| Variable | Description |
|----------|-------------|
| `VITE_TON_API_KEY` | TonCenter API key for mainnet |
| `VITE_TON_API_TESTNET_KEY` | TonCenter API key for testnet |

Sensible fallbacks are provided in [`src/core/configs/env.ts`](./src/core/configs/env.ts), so the app runs without any setup.

AppKit is configured in [`src/core/configs/app-kit.ts`](./src/core/configs/app-kit.ts):

- **Networks**: mainnet, testnet, tetra
- **Connectors**: TON Connect
- **Providers**: Omniston (swap), DeDust (swap), Tonstakers (staking)
- **Streaming**: TonCenter streaming providers for mainnet and testnet
