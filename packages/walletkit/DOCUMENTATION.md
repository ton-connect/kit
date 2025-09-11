## TonWalletKit – Integration Guide

This guide shows how to integrate `@ton/walletkit` into your app with minimal boilerplate. It abstracts TON Connect and wallet specifics behind a clean API and UI-friendly events.

After you complete this guide, you'll have your wallet fully integrated with the TON ecosystem. You'll be able to interact with dApps, NFTs, and jettons.

### Install

Use pnpm:

```bash
pnpm add @ton/walletkit
```

### 1) Initialize the kit

```ts
import { TonWalletKit, createWalletInitConfigMnemonic } from '@ton/walletkit';

const kit = new TonWalletKit({
  bridgeUrl: 'https://bridge.tonapi.io/bridge',
  network: 'mainnet',
});

// Optionally preload a wallet (mnemonic/private key/signer)
const walletConfig = createWalletInitConfigMnemonic({
  mnemonic: ['word1', 'word2', '...'],
  version: 'v5r1',
  mnemonicType: 'ton',
  network: 'mainnet',
});
await kit.addWallet(walletConfig);
```

### 2) Listen for requests from dApps

Register simple callbacks that show UI and then approve or reject via kit methods.

```ts
// Connect requests
kit.onConnectRequest(async (req) => {
  const selected = getSelectedWalletAddress();
  const wallet = kit.getWallet(selected);
  if (!wallet) return;

  // Minimal confirmation flow using preview
  const name = req.preview.manifest?.name ?? req.dAppName;
  if (confirm(`Connect to ${name}?`)) {
    await kit.approveConnectRequest({ ...req, wallet });
  } else {
    await kit.rejectConnectRequest(req, 'User rejected');
  }
});

// Transaction requests
kit.onTransactionRequest(async (tx) => {
  // You can surface tx.preview.moneyFlow for fees and affected balances
  if (confirm('Do you confirm this transaction?')) {
    await kit.approveTransactionRequest(tx);
  } else {
    await kit.rejectTransactionRequest(tx, 'User rejected');
  }
});

// Sign data requests
kit.onSignDataRequest(async (sd) => {
  // You can render sd.preview.kind === 'text' | 'binary' | 'cell'
  if (confirm('Sign this data?')) {
    await kit.signDataRequest(sd);
  } else {
    await kit.rejectSignDataRequest(sd, 'User rejected');
  }
});

// Disconnect events
kit.onDisconnect((evt) => {
  cleanupAfterDisconnect(evt.wallet.getAddress());
});
```

### 3) Handle TON Connect links

Pass a TON Connect URL to the kit to trigger a connect request event.

```ts
// Example: from a QR scanner or deep link
async function onTonConnectLink(url: string) {
  await kit.handleTonConnectUrl(url);
}
```

### 4) Basic wallet operations

```ts
const address = getSelectedWalletAddress();
const current = kit.getWallet(address);
if (!current) return;
const balance = await current.getBalance();
console.log(address, balance.toString());
```

### 5) Understanding previews (for your UI)

- **ConnectPreview (`req.preview`)**: Information about the dApp asking to connect. Includes `manifest` (name, description, icon), `requestedItems`, and `permissions` your UI can show before approval.
- **TransactionPreview (`tx.preview`)**: Human-readable transaction summary. On success, `preview.moneyFlow` contains estimated total fees and balance deltas, and `preview.emulationResult` has low-level emulation details. On error, `preview.result === 'error'` with an `emulationError`.
- **SignDataPreview (`sd.preview`)**: Shape of the data to sign. `kind` is `'text' | 'binary' | 'cell'`; use this to render a safe preview.

You can display these previews directly in your confirmation modals.

### 6) Sending assets programmatically

You can create transactions from your app using the wallet interfaces and then feed them into the regular approval flow via `handleNewTransaction`.

#### Send TON

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

#### Send Jettons (fungible tokens)

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

Notes:
- `amount` is the raw integer amount (apply jetton decimals yourself).
- The transaction includes TON for gas automatically.

#### Send NFTs

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
const { preview } = await wallet.getTransactionPreview(tx);
await kit.handleNewTransaction(wallet, tx);
```

Fetching NFTs:

```ts
const items = await wallet.getNfts({ offset: 0, limit: 50 });
// items.items is an array of NftItem
```

### Example: minimal UI state wiring

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
  await kit.approveConnectRequest({ ...state.connectModal.request, wallet });
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

### Error handling tips

- Wrap approvals in try/catch to surface actionable messages.
- Validate there is at least one wallet before approving a connect.
- Surface preview data to users: `req.preview`, `tx.preview.moneyFlow`, `sd.preview`.

### Demo wallet reference

See `apps/demo-wallet` for a working example. The store slice `src/stores/slices/walletSlice.ts` shows how to:

- Initialize the kit and add a wallet from mnemonic.
- Wire `onConnectRequest` and `onTransactionRequest` to open modals.
- Approve or reject requests using the kit methods.


