---
target: packages/appkit/README.md
---

# TonAppKit

A dApp-side integration layer for TON Connect with a unified asset API for TON, Jettons, and NFTs

[![npm @ton/appkit version](https://img.shields.io/npm/v/@ton/appkit)](https://www.npmjs.com/package/@ton/appkit)
[![Release](https://github.com/ton-connect/kit/actions/workflows/release.yml/badge.svg)](https://github.com/ton-connect/kit/actions/workflows/release.yml)
[![Tests](https://github.com/ton-connect/kit/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/ton-connect/kit/actions/workflows/test.yml)

## Overview

- **TonConnect Integration** - Seamlessly work with TonConnect wallets
- **Asset Operations** - Send TON, Jettons, and NFTs through TonConnect
- **React Integration** - Hooks for easy React/Next.js integration
- **Type Safety** - Full TypeScript support

**Live Demo**: [AppKit Minter](https://github.com/ton-connect/kit/tree/main/apps/appkit-minter)

## Documentation

[![DeepWiki](https://img.shields.io/badge/DeepWiki-ton--connect%2Fkit-blue.svg?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAyCAYAAAAnWDnqAAAAAXNSR0IArs4c6QAAA05JREFUaEPtmUtyEzEQhtWTQyQLHNak2AB7ZnyXZMEjXMGeK/AIi+QuHrMnbChYY7MIh8g01fJoopFb0uhhEqqcbWTp06/uv1saEDv4O3n3dV60RfP947Mm9/SQc0ICFQgzfc4CYZoTPAswgSJCCUJUnAAoRHOAUOcATwbmVLWdGoH//PB8mnKqScAhsD0kYP3j/Yt5LPQe2KvcXmGvRHcDnpxfL2zOYJ1mFwrryWTz0advv1Ut4CJgf5uhDuDj5eUcAUoahrdY/56ebRWeraTjMt/00Sh3UDtjgHtQNHwcRGOC98BJEAEymycmYcWwOprTgcB6VZ5JK5TAJ+fXGLBm3FDAmn6oPPjR4rKCAoJCal2eAiQp2x0vxTPB3ALO2CRkwmDy5WohzBDwSEFKRwPbknEggCPB/imwrycgxX2NzoMCHhPkDwqYMr9tRcP5qNrMZHkVnOjRMWwLCcr8ohBVb1OMjxLwGCvjTikrsBOiA6fNyCrm8V1rP93iVPpwaE+gO0SsWmPiXB+jikdf6SizrT5qKasx5j8ABbHpFTx+vFXp9EnYQmLx02h1QTTrl6eDqxLnGjporxl3NL3agEvXdT0WmEost648sQOYAeJS9Q7bfUVoMGnjo4AZdUMQku50McDcMWcBPvr0SzbTAFDfvJqwLzgxwATnCgnp4wDl6Aa+Ax283gghmj+vj7feE2KBBRMW3FzOpLOADl0Isb5587h/U4gGvkt5v60Z1VLG8BhYjbzRwyQZemwAd6cCR5/XFWLYZRIMpX39AR0tjaGGiGzLVyhse5C9RKC6ai42ppWPKiBagOvaYk8lO7DajerabOZP46Lby5wKjw1HCRx7p9sVMOWGzb/vA1hwiWc6jm3MvQDTogQkiqIhJV0nBQBTU+3okKCFDy9WwferkHjtxib7t3xIUQtHxnIwtx4mpg26/HfwVNVDb4oI9RHmx5WGelRVlrtiw43zboCLaxv46AZeB3IlTkwouebTr1y2NjSpHz68WNFjHvupy3q8TFn3Hos2IAk4Ju5dCo8B3wP7VPr/FGaKiG+T+v+TQqIrOqMTL1VdWV1DdmcbO8KXBz6esmYWYKPwDL5b5FA1a0hwapHiom0r/cKaoqr+27/XcrS5UwSMbQAAAABJRU5ErkJggg==)](https://deepwiki.com/ton-connect/kit)

- **[TonConnect UI React](https://github.com/ton-connect/sdk/tree/main/packages/ui-react)** - React components for TonConnect

## Quick start

This guide shows how to integrate `@ton/appkit` into your dApp for asset operations with TonConnect wallets.

```bash
npm install @ton/appkit @tonconnect/sdk
```

## Initialize AppKit and wrap wallet

%%demo/examples/src/appkit#APPKIT_INIT%%

## Send TON

%%demo/examples/src/appkit#APPKIT_SEND_TON%%

## Send Jettons

%%demo/examples/src/appkit#APPKIT_SEND_JETTONS%%

## Send NFTs

%%demo/examples/src/appkit#APPKIT_SEND_NFT%%

## Fetch Assets

### Fetch Jettons

%%demo/examples/src/appkit#APPKIT_FETCH_JETTONS%%

### Fetch NFTs

%%demo/examples/src/appkit#APPKIT_FETCH_NFTS%%

## React Integration

For React/Next.js apps using `@tonconnect/ui-react`:

%%demo/examples/src/appkit#APPKIT_REACT_HOOK%%

## Demo App

See [apps/appkit-minter](https://github.com/ton-connect/kit/tree/main/apps/appkit-minter) for a complete React app demonstrating:

- TonConnect wallet connection with `@tonconnect/ui-react`
- AppKit integration for asset operations
- Jetton and NFT transfers with confirmation modals
- Real-time asset loading and display

## API Reference

### CreateAppKit

Creates a new AppKit instance with network configuration.

```typescript
import { CreateAppKit } from '@ton/appkit';
import { Network } from '@ton/walletkit';

const appKit = CreateAppKit({
    networks: {
        [Network.mainnet().chainId]: {
            apiClient: {
                key: process.env.APP_TONCENTER_KEY, // optional, for better rate limits
                url: 'https://toncenter.com', // default for mainnet
            },
        },
        // Add testnet if needed
        // [Network.testnet().chainId]: {
        //     apiClient: {
        //         key: process.env.APP_TONCENTER_KEY_TESTNET,
        //         url: 'https://testnet.toncenter.com',
        //     },
        // },
    },
});
```

### wrapTonConnectWallet

Wraps a TonConnect wallet to access asset operations.

```typescript
const wallet = appKit.wrapTonConnectWallet(tonConnectWallet, tonConnect);
```

The wrapped wallet provides:

| Method | Description |
|--------|-------------|
| `getAddress()` | Get wallet address |
| `getBalance()` | Get TON balance |
| `getJettons()` | Fetch jetton balances |
| `getNfts()` | Fetch owned NFTs |
| `createTransferTonTransaction()` | Build TON transfer |
| `createTransferJettonTransaction()` | Build jetton transfer |
| `createTransferNftTransaction()` | Build NFT transfer |
| `sendTransaction()` | Sign and send via TonConnect |

## Resources

- [TON Connect Protocol](https://github.com/ton-blockchain/ton-connect) - Official TON Connect protocol specification
- [TonConnect SDK](https://github.com/ton-connect/sdk) - TonConnect JavaScript SDK

## License

MIT License - see LICENSE file for details
