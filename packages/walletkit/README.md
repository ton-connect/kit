# TonWalletKit

A production-ready wallet-side integration layer for TON Connect, designed for building TON wallets at scale

[![npm @ton/walletkit version](https://img.shields.io/npm/v/@ton/walletkit)](https://www.npmjs.com/package/@ton/walletkit)
[![Release](https://github.com/ton-connect/kit/actions/workflows/release.yml/badge.svg)](https://github.com/ton-connect/kit/actions/workflows/release.yml)
[![Basic build and tests](https://github.com/ton-connect/kit/actions/workflows/test.yml/badge.svg?branch=main)](https://github.com/ton-connect/kit/actions/workflows/test.yml)
[![e2e extension](https://github.com/ton-connect/kit/actions/workflows/e2e_extension.yml/badge.svg?branch=main)](https://github.com/ton-connect/kit/actions/workflows/e2e_extension.yml)
[![e2e web](https://github.com/ton-connect/kit/actions/workflows/e2e_web.yml/badge.svg?branch=main)](https://github.com/ton-connect/kit/actions/workflows/e2e_web.yml)

## Overview

- 🔗 **TON Connect Protocol** - Handle connect/disconnect/transaction/sign-data requests
- 💼 **Wallet Management** - Multi-wallet support with persistent storage
- 🌉 **Bridge & JS Bridge** - HTTP bridge and browser extension support
- 🎨 **Previews for actions** - Transaction emulation with money flow analysis
- 🪙 **Asset Support** - TON, Jettons, NFTs with metadata

**Live Demo**: [https://walletkit-demo-wallet.vercel.app/](https://walletkit-demo-wallet.vercel.app/)

## Documentation

[![DeepWiki](https://img.shields.io/badge/DeepWiki-ton--connect%2Fkit-blue.svg?logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAyCAYAAAAnWDnqAAAAAXNSR0IArs4c6QAAA05JREFUaEPtmUtyEzEQhtWTQyQLHNak2AB7ZnyXZMEjXMGeK/AIi+QuHrMnbChYY7MIh8g01fJoopFb0uhhEqqcbWTp06/uv1saEDv4O3n3dV60RfP947Mm9/SQc0ICFQgzfc4CYZoTPAswgSJCCUJUnAAoRHOAUOcATwbmVLWdGoH//PB8mnKqScAhsD0kYP3j/Yt5LPQe2KvcXmGvRHcDnpxfL2zOYJ1mFwrryWTz0advv1Ut4CJgf5uhDuDj5eUcAUoahrdY/56ebRWeraTjMt/00Sh3UDtjgHtQNHwcRGOC98BJEAEymycmYcWwOprTgcB6VZ5JK5TAJ+fXGLBm3FDAmn6oPPjR4rKCAoJCal2eAiQp2x0vxTPB3ALO2CRkwmDy5WohzBDwSEFKRwPbknEggCPB/imwrycgxX2NzoMCHhPkDwqYMr9tRcP5qNrMZHkVnOjRMWwLCcr8ohBVb1OMjxLwGCvjTikrsBOiA6fNyCrm8V1rP93iVPpwaE+gO0SsWmPiXB+jikdf6SizrT5qKasx5j8ABbHpFTx+vFXp9EnYQmLx02h1QTTrl6eDqxLnGjporxl3NL3agEvXdT0WmEost648sQOYAeJS9Q7bfUVoMGnjo4AZdUMQku50McDcMWcBPvr0SzbTAFDfvJqwLzgxwATnCgnp4wDl6Aa+Ax283gghmj+vj7feE2KBBRMW3FzOpLOADl0Isb5587h/U4gGvkt5v60Z1VLG8BhYjbzRwyQZemwAd6cCR5/XFWLYZRIMpX39AR0tjaGGiGzLVyhse5C9RKC6ai42ppWPKiBagOvaYk8lO7DajerabOZP46Lby5wKjw1HCRx7p9sVMOWGzb/vA1hwiWc6jm3MvQDTogQkiqIhJV0nBQBTU+3okKCFDy9WwferkHjtxib7t3xIUQtHxnIwtx4mpg26/HfwVNVDb4oI9RHmx5WGelRVlrtiw43zboCLaxv46AZeB3IlTkwouebTr1y2NjSpHz68WNFjHvupy3q8TFn3Hos2IAk4Ju5dCo8B3wP7VPr/FGaKiG+T+v+TQqIrOqMTL1VdWV1DdmcbO8KXBz6esmYWYKPwDL5b5FA1a0hwapHiom0r/cKaoqr+27/XcrS5UwSMbQAAAABJRU5ErkJggg==)](https://deepwiki.com/ton-connect/kit)

- **[Browser Extension Build](/apps/demo-wallet/EXTENSION.md)** - How to build and load the demo wallet as a Chrome extension
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

```ts
import { 
  TonWalletKit,      // Main SDK class
  Signer,            // Handles cryptographic signing
  WalletV5R1Adapter, // Latest wallet version (recommended)
  CHAIN,             // Network constants (MAINNET/TESTNET)
} from '@ton/walletkit';

const kit = new TonWalletKit({
  // Multi-network API configuration
  networks: {
    [CHAIN.MAINNET]: {
      apiClient: {
        // Optional API key for Toncenter get on https://t.me/toncenter
        key: process.env.APP_TONCENTER_KEY,
        url: 'https://toncenter.com', // default
        // or use self-hosted from https://github.com/toncenter/ton-http-api
      },
    },
    // Optionally configure testnet as well
    // [CHAIN.TESTNET]: {
    //   apiClient: {
    //     key: process.env.APP_TONCENTER_KEY_TESTNET,
    //     url: 'https://testnet.toncenter.com',
    //   },
    // },
  },
  bridge: {
    // TON Connect bridge for dApp communication
    bridgeUrl: 'https://connect.ton.org/bridge',
    // or use self-hosted bridge from https://github.com/ton-connect/bridge
  },
});

// Wait for initialization to complete
await kit.waitForReady();

// Add a wallet from mnemonic (24-word seed phrase) ton or bip39
const mnemonic = process.env.APP_MNEMONIC!.split(' ');
const signer = await Signer.fromMnemonic(mnemonic, { type: 'ton' });

const walletV5R1Adapter = await WalletV5R1Adapter.create(signer, {
  client: kit.getApiClient(CHAIN.MAINNET),
  network: CHAIN.MAINNET,
});

const walletV5R1 = await kit.addWallet(walletV5R1Adapter);
if (walletV5R1) {
  console.log('V5R1 Address:', walletV5R1.getAddress());
  console.log('V5R1 Balance:', await walletV5R1.getBalance());
}
```

## Understanding previews (for your UI)

Before handling requests, it's helpful to understand the preview data that the kit provides for each request type. These previews help you display user-friendly confirmation dialogs.

- **ConnectPreview (`req.preview`)**: Information about the dApp asking to connect. Includes `manifest` (name, description, icon), `requestedItems`, and `permissions` your UI can show before approval.
- **TransactionPreview (`tx.preview`)**: Human-readable transaction summary. On success, `preview.moneyFlow.ourTransfers` contains an array of net asset changes (TON and jettons) with positive amounts for incoming and negative for outgoing. `preview.moneyFlow.inputs` and `preview.moneyFlow.outputs` show raw TON flow, and `preview.emulationResult` has low-level emulation details. On error, `preview.result === 'error'` with an `emulationError`.
- **SignDataPreview (`sd.preview`)**: Shape of the data to sign. `kind` is `'text' | 'binary' | 'cell'`. Use this to render a safe preview.

You can display these previews directly in your confirmation modals.

## Listen for requests from dApps

Register callbacks that show UI and then approve or reject via kit methods. Note: `getSelectedWalletAddress()` is a placeholder for your own wallet selection logic.

```ts
// Connect requests - triggered when a dApp wants to connect
kit.onConnectRequest(async (req) => {
  try {
    // Use req.preview to display dApp info in your UI
    const name = req.dAppInfo?.name;
    if (confirm(`Connect to ${name}?`)) {
      // Set wallet address on the request before approving
      req.walletAddress = getSelectedWalletAddress(); // Your wallet selection logic
      await kit.approveConnectRequest(req);
    } else {
      await kit.rejectConnectRequest(req, 'User rejected');
    }
  } catch (error) {
    console.error('Connect request failed:', error);
    await kit.rejectConnectRequest(req, 'Error processing request');
  }
});

// Transaction requests - triggered when a dApp wants to execute a transaction
kit.onTransactionRequest(async (tx) => {
  try {
    // Use tx.preview.moneyFlow.ourTransfers to show net asset changes
    // Each transfer shows positive amounts for incoming, negative for outgoing
    if (confirm('Do you confirm this transaction?')) {
      await kit.approveTransactionRequest(tx);
    } else {
      await kit.rejectTransactionRequest(tx, 'User rejected');
    }
  } catch (error) {
    console.error('Transaction request failed:', error);
    await kit.rejectTransactionRequest(tx, 'Error processing request');
  }
});

// Sign data requests - triggered when a dApp wants to sign arbitrary data
kit.onSignDataRequest(async (sd) => {
  try {
    // Use sd.preview.kind to determine how to display the data
    if (confirm('Sign this data?')) {
      await kit.signDataRequest(sd);
    } else {
      await kit.rejectSignDataRequest(sd, 'User rejected');
    }
  } catch (error) {
    console.error('Sign data request failed:', error);
    await kit.rejectSignDataRequest(sd, 'Error processing request');
  }
});

// Disconnect events - triggered when a dApp disconnects
kit.onDisconnect((evt) => {
  // Clean up any UI state related to this connection
  console.log(`Disconnected from wallet: ${evt.walletAddress}`);
});
```

### Handle TON Connect links

When users scan a QR code or click a deep link from a dApp, pass the TON Connect URL to the kit. This will trigger your `onConnectRequest` callback.

```ts
// Example: from a QR scanner, deep link, or URL parameter
async function onTonConnectLink(url: string) {
  // url format: tc://connect?...
  await kit.handleTonConnectUrl(url);
}
```

### Basic wallet operations

```ts
// Get wallet instance (getSelectedWalletAddress is your own logic)
const address = getSelectedWalletAddress();
const current = kit.getWallet(address);
if (!current) return;

// Query balance
const balance = await current.getBalance();
console.log(address, balance.toString());
```

### Rendering previews (reference)

The snippets below mirror how the demo wallet renders previews in its modals. Adapt them to your UI framework.

Render Connect preview:

```ts
function renderConnectPreview(req: EventConnectRequest) {
  const name = req.preview.manifest?.name ?? req.dAppInfo?.name;
  const description = req.preview.manifest?.description;
  const iconUrl = req.preview.manifest?.iconUrl;
  const permissions = req.preview.permissions ?? [];

  return {
    title: `Connect to ${name}?`,
    iconUrl,
    description,
    permissions: permissions.map((p) => ({ title: p.title, description: p.description })),
  };
}
```

Render Transaction preview (money flow overview):

```ts
import type { MoneyFlowSelf } from '@ton/walletkit';

function summarizeTransaction(preview: TransactionPreview) {
  if (preview.result === 'error') {
    return { kind: 'error', message: preview.emulationError.message } as const;
  }

  // MoneyFlow now provides ourTransfers - a simplified array of net asset changes
  const transfers = preview.moneyFlow.ourTransfers; // Array of MoneyFlowSelf

  // Each transfer has:
  // - type: 'ton' | 'jetton'
  // - amount: string (positive for incoming, negative for outgoing)
  // - jetton?: string (jetton master address, if type === 'jetton')

  return {
    kind: 'success' as const,
    transfers: transfers.map((transfer) => ({
      type: transfer.type,
      jettonAddress: transfer.type === 'jetton' ? transfer.jetton : 'TON',
      amount: transfer.amount, // string, can be positive or negative
      isIncoming: BigInt(transfer.amount) >= 0n,
    })),
  };
}
```

Example UI rendering:

```tsx
function renderMoneyFlow(transfers: MoneyFlowSelf[]) {
  if (transfers.length === 0) {
    return <div>This transaction doesn't involve any token transfers</div>;
  }

  return transfers.map((transfer) => {
    const amount = BigInt(transfer.amount);
    const isIncoming = amount >= 0n;
    const jettonAddress = transfer.type === 'jetton' ? transfer.jetton : 'TON';

    return (
      <div key={jettonAddress}>
        <span>{isIncoming ? '+' : ''}{transfer.amount}</span>
        <span>{jettonAddress}</span>
      </div>
    );
  });
}
```

Render Sign-Data preview:

```ts
function renderSignDataPreview(preview: SignDataPreview) {
  switch (preview.kind) {
    case 'text':
      return { type: 'text', content: preview.content };
    case 'binary':
      return { type: 'binary', content: preview.content };
    case 'cell':
      return {
        type: 'cell',
        content: preview.content,
        schema: preview.schema,
        parsed: preview.parsed,
      };
  }
}
```

**Tip:** For jetton names/symbols and images in transaction previews, you can enrich the UI using:

```ts
const info = kit.jettons.getJettonInfo(jettonAddress);
// info?.name, info?.symbol, info?.image
```

## Sending assets programmatically

You can create transactions from your wallet app (not from dApps) and feed them into the regular approval flow via `handleNewTransaction`. This triggers your `onTransactionRequest` callback, allowing the same UI confirmation flow for both dApp and wallet-initiated transactions.

### Send TON

```ts
import type { TonTransferParams } from '@ton/walletkit';

const from = kit.getWallet(getSelectedWalletAddress());
if (!from) throw new Error('No wallet');

const tonTransfer: TonTransferParams = {
  toAddress: 'EQC...recipient...',
  amount: (1n * 10n ** 9n).toString(), // 1 TON in nanotons
  // Optional comment OR body (base64 BOC), not both
  comment: 'Thanks!'
};

// 1) Build transaction content
const tx = await from.createTransferTonTransaction(tonTransfer);

// 2) Route into the normal flow (triggers onTransactionRequest)
await kit.handleNewTransaction(from, tx);
```

### Send Jettons (fungible tokens)

```ts
import type { JettonTransferParams } from '@ton/walletkit';

const wallet = kit.getWallet(getSelectedWalletAddress());
if (!wallet) throw new Error('No wallet');

const jettonTransfer: JettonTransferParams = {
  toAddress: 'EQC...recipient...',
  jettonAddress: 'EQD...jetton-master...',
  amount: '1000000000', // raw amount per token decimals
  comment: 'Payment'
};

const tx = await wallet.createTransferJettonTransaction(jettonTransfer);
await kit.handleNewTransaction(wallet, tx);
```

**Notes:**
- `amount` is the raw integer amount (apply jetton decimals yourself)
- The transaction includes TON for gas automatically

### Send NFTs

```ts
import type { NftTransferParamsHuman } from '@ton/walletkit';

const wallet = kit.getWallet(getSelectedWalletAddress());
if (!wallet) throw new Error('No wallet');

const nftTransfer: NftTransferParamsHuman = {
  nftAddress: 'EQD...nft-item...',
  toAddress: 'EQC...recipient...',
  transferAmount: 10000000n, // TON used to invoke NFT transfer (nanotons)
  comment: 'Gift'
};

const tx = await wallet.createTransferNftTransaction(nftTransfer);
await kit.handleNewTransaction(wallet, tx);
```

**Fetching NFTs:**

```ts
const items = await wallet.getNfts({ offset: 0, limit: 50 });
// items.items is an array of NftItem
```

## Example: minimal UI state wiring

```ts
type AppState = {
  connectModal?: { request: any };
  txModal?: { request: any };
};

const state: AppState = {};

kit.onConnectRequest((req) => {
  state.connectModal = { request: req };
});

kit.onTransactionRequest((tx) => {
  state.txModal = { request: tx };
});

async function approveConnect() {
  if (!state.connectModal) return;
  const address = getSelectedWalletAddress();
  const wallet = kit.getWallet(address);
  if (!wallet) return;
  // Set wallet address on the request
  state.connectModal.request.walletAddress = wallet.getAddress();
  await kit.approveConnectRequest(state.connectModal.request);
  state.connectModal = undefined;
}

async function rejectConnect() {
  if (!state.connectModal) return;
  await kit.rejectConnectRequest(state.connectModal.request, 'User rejected');
  state.connectModal = undefined;
}

async function approveTx() {
  if (!state.txModal) return;
  await kit.approveTransactionRequest(state.txModal.request);
  state.txModal = undefined;
}

async function rejectTx() {
  if (!state.txModal) return;
  await kit.rejectTransactionRequest(state.txModal.request, 'User rejected');
  state.txModal = undefined;
}
```

## Demo wallet reference

**Live Demo**: [https://walletkit-demo-wallet.vercel.app/](https://walletkit-demo-wallet.vercel.app/)

- **Web**: See `apps/demo-wallet` for the full implementation.
- **React Native**: See `apps/demo-wallet-native` for the Expo-based mobile wallet.

The store slices [walletCoreSlice.ts](/packages/demo-core/src/store/slices/walletCoreSlice.ts) and [tonConnectSlice.ts](/packages/demo-core/src/store/slices/tonConnectSlice.ts) show how to:

- Initialize the kit and add a wallet from mnemonic
- Wire `onConnectRequest` and `onTransactionRequest` to open modals
- Approve or reject requests using the kit methods

## Resources

- [TON Connect Protocol](https://github.com/ton-blockchain/ton-connect) - Official TON Connect protocol specification
- [Live Demo](https://walletkit-demo-wallet.vercel.app/) - Reference implementation [sources](/apps/demo-wallet)
- [Complete development guide](DEVELOPMENT.md)

## License

MIT License - see LICENSE file for details
