---
target: packages/walletkit/README.md
---

# TonWalletKit

A production-ready wallet-side integration layer for TON Connect, designed for building TON wallets at scale

[![npm @ton/walletkit version](https://img.shields.io/npm/v/@ton/walletkit)](https://www.npmjs.com/package/@ton/walletkit)
[![Release](https://github.com/ton-connect/kit/actions/workflows/release.yml/badge.svg?branch=release)](https://github.com/ton-connect/kit/actions/workflows/release.yml)
[![Tests](https://github.com/ton-connect/kit/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/ton-connect/kit/actions/workflows/test.yml)

## Overview

- 🔗 **TON Connect Protocol** - Handle connect/disconnect/transaction/sign-data requests
- 💼 **Wallet Management** - Multi-wallet support with persistent storage
- 🌉 **Bridge & JS Bridge** - HTTP bridge and browser extension support
- 🎨 **Previews for actions** - Transaction emulation with money flow analysis
- 🪙 **Asset Support** - TON, Jettons, NFTs with metadata

**Live Demo**: [https://walletkit-demo-wallet.vercel.app/](https://walletkit-demo-wallet.vercel.app/)

## Documentation

[![DeepWiki](https://img.shields.io/badge/DeepWiki-ton--connect%2Fkit-blue.svg?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAyCAYAAAAnWDnqAAAAAXNSR0IArs4c6QAAA05JREFUaEPtmUtyEzEQhtWTQyQLHNak2AB7ZnyXZMEjXMGeK/AIi+QuHrMnbChYY7MIh8g01fJoopFb0uhhEqqcbWTp06/uv1saEDv4O3n3dV60RfP947Mm9/SQc0ICFQgzfc4CYZoTPAswgSJCCUJUnAAoRHOAUOcATwbmVLWdGoH//PB8mnKqScAhsD0kYP3j/Yt5LPQe2KvcXmGvRHcDnpxfL2zOYJ1mFwrryWTz0advv1Ut4CJgf5uhDuDj5eUcAUoahrdY/56ebRWeraTjMt/00Sh3UDtjgHtQNHwcRGOC98BJEAEymycmYcWwOprTgcB6VZ5JK5TAJ+fXGLBm3FDAmn6oPPjR4rKCAoJCal2eAiQp2x0vxTPB3ALO2CRkwmDy5WohzBDwSEFKRwPbknEggCPB/imwrycgxX2NzoMCHhPkDwqYMr9tRcP5qNrMZHkVnOjRMWwLCcr8ohBVb1OMjxLwGCvjTikrsBOiA6fNyCrm8V1rP93iVPpwaE+gO0SsWmPiXB+jikdf6SizrT5qKasx5j8ABbHpFTx+vFXp9EnYQmLx02h1QTTrl6eDqxLnGjporxl3NL3agEvXdT0WmEost648sQOYAeJS9Q7bfUVoMGnjo4AZdUMQku50McDcMWcBPvr0SzbTAFDfvJqwLzgxwATnCgnp4wDl6Aa+Ax283gghmj+vj7feE2KBBRMW3FzOpLOADl0Isb5587h/U4gGvkt5v60Z1VLG8BhYjbzRwyQZemwAd6cCR5/XFWLYZRIMpX39AR0tjaGGiGzLVyhse5C9RKC6ai42ppWPKiBagOvaYk8lO7DajerabOZP46Lby5wKjw1HCRx7p9sVMOWGzb/vA1hwiWc6jm3MvQDTogQkiqIhJV0nBQBTU+3okKCFDy9WwferkHjtxib7t3xIUQtHxnIwtx4mpg26/HfwVNVDb4oI9RHmx5WGelRVlrtiw43zboCLaxv46AZeB3IlTkwouebTr1y2NjSpHz68WNFjHvupy3q8TFn3Hos2IAk4Ju5dCo8B3wP7VPr/FGaKiG+T+v+TQqIrOqMTL1VdWV1DdmcbO8KXBz6esmYWYKPwDL5b5FA1a0hwapHiom0r/cKaoqr+27/XcrS5UwSMbQAAAABJRU5ErkJggg==)](https://deepwiki.com/ton-connect/kit)

- **[Browser Extension Build](https://github.com/ton-connect/kit/blob/main/apps/demo-wallet/EXTENSION.md)** - How to build and load the demo wallet as a Chrome extension
- **[JS Bridge Usage](/packages/walletkit/examples/js-bridge-usage.md)** - Implementing TonConnect JS Bridge for browser extension wallets
- **[iOS WalletKit](https://github.com/ton-connect/kit-ios)** - Swift Package providing TON wallet capabilities for iOS and macOS
- **[Android WalletKit](https://github.com/ton-connect/kit-android)** - Kotlin/Java Package providing TON wallet capabilities for Android

### Tutorials

- [How to initialize the TON Connect's](https://docs.ton.org/ecosystem/ton-connect/walletkit/web/init)
- [How to manage TON wallets](https://docs.ton.org/ecosystem/ton-connect/walletkit/web/wallets)
- [How to handle connections](https://docs.ton.org/ecosystem/ton-connect/walletkit/web/connections)
- [How to handle other events](https://docs.ton.org/ecosystem/ton-connect/walletkit/web/events)

## Quick start

This guide shows how to integrate `@ton/walletkit` into your app with minimal boilerplate. It abstracts TON Connect and wallet implementation details behind a clean API and UI-friendly events.

After you complete this guide, you'll have your wallet fully integrated with the TON ecosystem. You'll be able to interact with dApps, NFTs, and jettons.

```bash
npm install @ton/walletkit
```

## Initialize the kit

%%demo/examples/src#INIT_KIT%%

## Understanding previews (for your UI)

Before handling requests, it's helpful to understand the preview data that the kit provides for each request type. These previews help you display user-friendly confirmation dialogs.

- **ConnectPreview (`req.preview`)**: Information about the dApp asking to connect. Includes `manifest` (name, description, icon), `requestedItems`, and `permissions` your UI can show before approval.
- **TransactionPreview (`tx.preview`)**: Human-readable transaction summary. On success, `preview.moneyFlow.ourTransfers` contains an array of net asset changes (TON and jettons) with positive amounts for incoming and negative for outgoing. `preview.moneyFlow.inputs` and `preview.moneyFlow.outputs` show raw TON flow, and `preview.emulationResult` has low-level emulation details. On error, `preview.result === 'error'` with an `emulationError`.
- **SignDataPreview (`sd.preview`)**: Shape of the data to sign. `kind` is `'text' | 'binary' | 'cell'`. Use this to render a safe preview.

You can display these previews directly in your confirmation modals.

## Listen for requests from dApps

Register callbacks that show UI and then approve or reject via kit methods. Note: `getSelectedWalletAddress()` is a placeholder for your own wallet selection logic.

%%demo/examples/src#LISTEN_FOR_REQUESTS%%


### Handle TON Connect links

When users scan a QR code or click a deep link from a dApp, pass the TON Connect URL to the kit. This will trigger your `onConnectRequest` callback.

%%demo/examples/src#ON_TON_CONNECT_LINK%%

### Basic wallet operations

%%demo/examples/src#BASIC_WALLET_OPERATIONS%%

### Rendering previews (reference)

The snippets below mirror how the demo wallet renders previews in its modals. Adapt them to your UI framework.

Render Connect preview:

%%demo/examples/src#RENDER_CONNECT_PREVIEW%%

Render Transaction preview (money flow overview):

%%demo/examples/src#SUMMARIZE_TRANSACTION%%

Example UI rendering:

%%demo/examples/src#RENDER_MONEY_FLOW%%

Render Sign-Data preview:

%%demo/examples/src#RENDER_SIGN_DATA_PREVIEW%%

**Tip:** For jetton names/symbols and images in transaction previews, you can enrich the UI using:

%%demo/examples/src#GET_JETTON_INFO%%

## Sending assets programmatically

You can create transactions from your wallet app (not from dApps) and feed them into the regular approval flow via `handleNewTransaction`. This triggers your `onTransactionRequest` callback, allowing the same UI confirmation flow for both dApp and wallet-initiated transactions.

### Send TON

%%demo/examples/src#SEND_TON%%

### Send Jettons (fungible tokens)

%%demo/examples/src#SEND_JETTONS%%

**Notes:**
- `amount` is the raw integer amount (apply jetton decimals yourself)
- The transaction includes TON for gas automatically

### Send NFTs

%%demo/examples/src#SEND_NFTS%%

**Fetching NFTs:**

%%demo/examples/src#FETCHING_NFTS%%

Note: The `getNfts` method returns `NFTsResponse` with a `nfts` field (not `items`).

## Example: minimal UI state wiring

%%demo/examples/src#MINIMAL_UI_STATE_WIRING%%

## Demo wallet reference

**Live Demo**: [https://walletkit-demo-wallet.vercel.app/](https://walletkit-demo-wallet.vercel.app/)

- **Web**: See [apps/demo-wallet](https://github.com/ton-connect/kit/tree/main/apps/demo-wallet) for the full implementation.
- **React Native**: See [apps/demo-wallet-native](https://github.com/ton-connect/kit/tree/main/apps/demo-wallet-native) for the Expo-based mobile wallet.

The store slices [walletCoreSlice.ts](https://github.com/ton-connect/kit/blob/main/demo/wallet-core/src/store/slices/walletCoreSlice.ts) and [tonConnectSlice.ts](https://github.com/ton-connect/kit/blob/main/demo/wallet-core/src/store/slices/tonConnectSlice.ts) show how to:

- Initialize the kit and add a wallet from mnemonic
- Wire `onConnectRequest` and `onTransactionRequest` to open modals
- Approve or reject requests using the kit methods

## Resources

- [TON Connect Protocol](https://github.com/ton-blockchain/ton-connect) - Official TON Connect protocol specification
- [Live Demo](https://walletkit-demo-wallet.vercel.app/) - Reference implementation [sources](https://github.com/ton-connect/kit/tree/main/apps/demo-wallet)
- [Complete development guide](https://github.com/ton-connect/kit/blob/main/packages/walletkit/DEVELOPMENT.md)

## License

MIT License - see LICENSE file for details
