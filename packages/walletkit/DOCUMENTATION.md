## TonWalletKit – Integration Guide

This guide shows how to integrate `@ton/walletkit` into your app with minimal boilerplate. It abstracts TON Connect and wallet implementation details behind a clean API and UI-friendly events.

After you complete this guide, you'll have your wallet fully integrated with the TON ecosystem. You'll be able to interact with dApps, NFTs, and jettons.

**Live Demo**: [https://walletkit-demo-wallet.vercel.app/](https://walletkit-demo-wallet.vercel.app/)

### Install

Use pnpm:

```bash
pnpm add @ton/walletkit
```

### 1) Initialize the kit

```ts
import { 
  TonWalletKit,      // Main SDK class
  Signer,            // Handles cryptographic signing
  WalletV5R1Adapter, // Latest wallet version (recommended)
  WalletV4R2Adapter, // Legacy wallet version
  CHAIN,             // Network constants (MAINNET/TESTNET)
} from '@ton/walletkit';

const kit = new TonWalletKit({
  network: CHAIN.MAINNET,
  // Optional API configuration
  apiClient: {
    key: 'your-api-key',  // Optional API key for Toncenter
    // url: 'https://toncenter.com',  // Optional custom API URL
  },
  bridge: {
    bridgeUrl: 'https://conmnect.ton.org/bridge',  // TON Connect bridge for dApp communication
  },
});

// Wait for initialization to complete
await kit.waitForReady();

// Add a wallet from mnemonic (24-word seed phrase)
const signer = await Signer.fromMnemonic(['word1', 'word2', '...'], { type: 'ton' });
const walletAdapter = await WalletV5R1Adapter.create(signer, {
  client: kit.getApiClient(),
  network: CHAIN.MAINNET,
});

await kit.addWallet(walletAdapter);
```

**Other wallet creation options:**

```ts
// From private key (hex string)
const signer = await Signer.fromPrivateKey('0x...');

// Using Wallet V4R2 (for compatibility with older wallets)
const walletAdapter = await WalletV4R2Adapter.create(signer, {
  client: kit.getApiClient(),
  network: CHAIN.MAINNET,
});
await kit.addWallet(walletAdapter);
```

### 2) Understanding previews (for your UI)

Before handling requests, it's helpful to understand the preview data that the kit provides for each request type. These previews help you display user-friendly confirmation dialogs.

- **ConnectPreview (`req.preview`)**: Information about the dApp asking to connect. Includes `manifest` (name, description, icon), `requestedItems`, and `permissions` your UI can show before approval.
- **TransactionPreview (`tx.preview`)**: Human-readable transaction summary. On success, `preview.moneyFlow.ourTransfers` contains an array of net asset changes (TON and jettons) with positive amounts for incoming and negative for outgoing. `preview.moneyFlow.inputs` and `preview.moneyFlow.outputs` show raw TON flow, and `preview.emulationResult` has low-level emulation details. On error, `preview.result === 'error'` with an `emulationError`.
- **SignDataPreview (`sd.preview`)**: Shape of the data to sign. `kind` is `'text' | 'binary' | 'cell'`; use this to render a safe preview.

You can display these previews directly in your confirmation modals.

### 3) Listen for requests from dApps

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

### 4) Handle TON Connect links

When users scan a QR code or click a deep link from a dApp, pass the TON Connect URL to the kit. This will trigger your `onConnectRequest` callback.

```ts
// Example: from a QR scanner, deep link, or URL parameter
async function onTonConnectLink(url: string) {
  // url format: tc://connect?...
  await kit.handleTonConnectUrl(url);
}
```

### 5) Basic wallet operations

```ts
// Get wallet instance (getSelectedWalletAddress is your own logic)
const address = getSelectedWalletAddress();
const current = kit.getWallet(address);
if (!current) return;

// Query balance
const balance = await current.getBalance();
console.log(address, balance.toString());
```

### 6) Rendering previews (reference)

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

Tip: For jetton names/symbols and images in transaction previews, you can enrich the UI using:

```ts
const info = kit.jettons.getJettonInfo(jettonAddress);
// info?.name, info?.symbol, info?.image
```

### 7) Sending assets programmatically

You can create transactions from your wallet app (not from dApps) and feed them into the regular approval flow via `handleNewTransaction`. This triggers your `onTransactionRequest` callback, allowing the same UI confirmation flow for both dApp and wallet-initiated transactions.

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
await kit.handleNewTransaction(wallet, tx);
```

Fetching NFTs:

```ts
const items = await wallet.getNfts({ offset: 0, limit: 50 });
// items.items is an array of NftItem
```

### 8) Example: minimal UI state wiring

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

### 9) Error handling tips

- Wrap approvals in try/catch to surface actionable messages (see examples in Section 3).
- Validate there is at least one wallet before approving a connect.
- Surface preview data to users: `req.preview`, `tx.preview.moneyFlow`, `sd.preview`.

### Demo wallet reference

**Live Demo**: [https://walletkit-demo-wallet.vercel.app/](https://walletkit-demo-wallet.vercel.app/)

See `apps/demo-wallet` for the full implementation. The store slice `src/stores/slices/walletSlice.ts` shows how to:

- Initialize the kit and add a wallet from mnemonic.
- Wire `onConnectRequest` and `onTransactionRequest` to open modals.
- Approve or reject requests using the kit methods.


