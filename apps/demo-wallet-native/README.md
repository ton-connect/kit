# TON Wallet (Demo Native)

React Native wallet for the TON blockchain, built with [Expo](https://expo.dev/) (SDK 54).

## Requirements

- **Node.js** v18+
- **pnpm** — package manager
- **Expo CLI** — installed automatically via `npx`
- **iOS**: Xcode 15+ and CocoaPods
- **Android**: Android Studio and Android SDK (API 34+)

> See [Expo Environment Setup](https://docs.expo.dev/get-started/set-up-your-environment/) for detailed instructions.

## Installation

```bash
# From the monorepo root
pnpm install

# Navigate to the app directory
cd apps/demo-wallet-native

# Run on iOS (requires macOS + Xcode)
pnpm ios

# Run on Android
pnpm android
```

### Available Commands

| Command | Description |
|---------|-------------|
| `pnpm start` | Start Expo dev server |
| `pnpm ios` | Build and run on iOS |
| `pnpm android` | Build and run on Android |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm clean` | Clean cache, node_modules, ios/, android/ |

## Features

- **Wallets** — create, import, and manage TON wallets with secure key storage
- **Balances** — view wallet balances and tokens
- **Transactions** — send/receive TON, transaction history
- **TON Connect** — connect to dApps via TON Connect protocol

## Polyfills

The app uses several polyfills for Node.js API compatibility in React Native environment.

Detailed documentation: [docs/POLYFILLS.md](./docs/POLYFILLS.md)

## Project Structure

```
apps/demo-wallet-native/
├── src/
│   ├── app/           # Expo Router pages
│   ├── core/          # Utilities, hooks, configuration
│   ├── features/      # Features (wallet, transactions, etc.)
│   └── globals.ts     # Polyfills initialization
├── polyfills/         # Custom polyfills
├── assets/            # Icons and images
├── metro.config.js    # Metro bundler configuration
└── app.json           # Expo configuration
```

### Wallet Kit

The project uses **@ton/walletkit** — SDK for working with TON wallets.

TypeScript path aliases are configured in `tsconfig.json` for convenient imports:

```json
{
  "paths": {
    "@ton/walletkit": ["./src/features/wallet-kit"],
    "@ton/walletkit/*": ["./src/features/wallet-kit/*"]
  }
}
```

## Useful Links

- [WalletKit README](../../README.md) — main SDK documentation
- [Expo Documentation](https://docs.expo.dev/)
- [React Native](https://reactnative.dev/)
- [TON Documentation](https://docs.ton.org/)
