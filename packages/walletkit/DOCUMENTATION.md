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
import { 
  TonWalletKit,
  createWalletInitConfigMnemonic,
  createWalletInitConfigPrivateKey,
  createWalletInitConfigSigner,
  CHAIN,
} from '@ton/walletkit';

const kit = new TonWalletKit({
  network: CHAIN.MAINNET,
  // Optional API configuration
  // apiKey: '...',
  // apiUrl: 'https://toncenter.com/api/v3',
  config: {
    bridge: {
      bridgeUrl: 'https://bridge.tonapi.io/bridge',
      // Optional JS bridge support (for extensions/injected providers)
      enableJsBridge: true,
      bridgeName: 'tonkeeper',
    },
  },
});

// Optionally preload a wallet (mnemonic/private key/signer)
const walletConfig = createWalletInitConfigMnemonic({
  mnemonic: ['word1', 'word2', '...'],
  version: 'v5r1',
  mnemonicType: 'ton',
  network: CHAIN.MAINNET,
});

/* Wallet from private key:
const walletConfig = createWalletInitConfigPrivateKey({
  privateKey: '0x...',
  version: 'v5r1',
  network: CHAIN.MAINNET,
});
*/

/* Wallet with your own signer:
const walletConfig = createWalletInitConfigSigner({
  publicKey: new Uint8Array([/* your public key bytes */]),
  version: 'v5r1',
  network: CHAIN.MAINNET,
  // bytes -> signature bytes (Uint8Array)
  sign: async (bytes) => yourSigner(bytes),
});
*/

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

#### Rendering previews (reference)

The snippets below mirror how the demo wallet renders previews in its modals. Adapt them to your UI framework.

Render Connect preview:

```ts
function renderConnectPreview(req: EventConnectRequest) {
  const name = req.preview.manifest?.name ?? req.dAppName;
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

Note: The moneyFlow summarization shown above is pseudocode and will change soon to a more user‑friendly version of the API and preview structure.

```ts
type MoneyFlowLike = {
  inputs: bigint;
  outputs: bigint;
  ourAddress: string | undefined;
  jettonTransfers: Array<{ from: string; to: string; jetton: string | null; amount: bigint }>;
};

function summarizeTransaction(preview: TransactionPreview) {
  if (preview.result === 'error') {
    return { kind: 'error', message: preview.emulationError.message } as const;
  }

  const mf: MoneyFlowLike = preview.moneyFlow as any;
  const tonDifference = mf.inputs - mf.outputs; // positive: receive TON, negative: spend TON

  // Optional: group jetton transfers by jetton address and compute net flow
  const jettonNet: Record<string, bigint> = {};
  for (const t of mf.jettonTransfers) {
    const key = (t.jetton ?? 'TON').toString();
    if (!jettonNet[key]) jettonNet[key] = 0n;
    if (mf.ourAddress && t.to === mf.ourAddress) jettonNet[key] += t.amount;
    if (mf.ourAddress && t.from === mf.ourAddress) jettonNet[key] -= t.amount;
  }

  return {
    kind: 'success' as const,
    tonDifference,
    jettonNet, // map of jettonAddress -> net amount (bigint)
    ourAddress: mf.ourAddress,
  };
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


