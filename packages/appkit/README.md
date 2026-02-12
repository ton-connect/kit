# TonAppKit

A dApp-side integration layer for TON Connect with a unified asset API for TON, Jettons, and NFTs

## Overview

- **Asset Operations** - Send TON, Jettons, and NFTs
- **React Integration** - Hooks for easy React/Next.js integration
- **Type Safety** - Full TypeScript support
- **TonConnect Integration** - Seamlessly work with TonConnect wallets

**Live Demo**: [AppKit Minter](https://github.com/ton-connect/kit/tree/main/apps/appkit-minter)

## Quick start

This guide shows how to integrate `@ton/appkit` into your dApp for asset operations with TonConnect wallets.

```bash
npm install @ton/appkit @tonconnect/sdk
```

## Initialize AppKit and wrap wallet

```ts
// Initialize AppKit
const appKit = new AppKit({
    networks: {
        [Network.mainnet().chainId]: {
            apiClient: {
                url: 'https://toncenter.com',
                key: 'your-key',
            },
        },
        // Optional: add testnet
        // [Network.testnet().chainId]: {
        //     apiClient: {
        //         url: 'https://testnet.toncenter.com',
        //         key: 'your-key',
        //     },
        // },
    },
    connectors: [
        new TonConnectConnector({
            tonConnectOptions: {
                manifestUrl: 'your-manifest-url',
            },
        }),
    ],
});
```

## Documentation

- [Actions](./docs/actions.md)
