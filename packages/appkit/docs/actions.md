# AppKit Actions

AppKit provides a comprehensive set of standalone actions to interact with the TON blockchain and manage wallet state.

## Wallet Management

### `connect`
Initiates a connection request to a specific connector.
```typescript
import { connect } from '@ton/appkit';
await connect(appKit, { connectorId: 'tonconnect' });
```

### `disconnect`
Disconnects the currently active wallet and clears session data.
```typescript
import { disconnect } from '@ton/appkit';
await disconnect(appKit);
```

### `getConnectors` / `watchConnectors`
`getConnectors` returns the list of registered connector providers. `watchConnectors` allows you to subscribe to changes in the connectors list.
```typescript
import { getConnectors, watchConnectors } from '@ton/appkit';
const connectors = getConnectors(appKit);
const unsubscribe = watchConnectors(appKit, { onChange: (c) => console.log(c) });
```

### `getConnectedWallets` / `watchConnectedWallets`
`getConnectedWallets` returns an array of all currently connected wallets. `watchConnectedWallets` triggers a callback whenever a wallet is connected or disconnected.
```typescript
import { getConnectedWallets, watchConnectedWallets } from '@ton/appkit';
const wallets = getConnectedWallets(appKit);
const unsubscribe = watchConnectedWallets(appKit, { onChange: (w) => console.log(w) });
```

### `getSelectedWallet` / `watchSelectedWallet`
`getSelectedWallet` returns the currently active/focused wallet. `watchSelectedWallet` notifies you when the user switches between connected wallets.
```typescript
import { getSelectedWallet, watchSelectedWallet } from '@ton/appkit';
const wallet = getSelectedWallet(appKit);
const unsubscribe = watchSelectedWallet(appKit, { onChange: (w) => console.log(w) });
```

### `setSelectedWalletId`
Sets a specific connected wallet as the "active" one by its unique ID.
```typescript
import { setSelectedWalletId } from '@ton/appkit';
setSelectedWalletId(appKit, { walletId: '...' });
```

## Asset Operations (Transfers)

### `transferTon`
A high-level action to send TON. It automatically handles address parsing and transaction building.
```typescript
import { transferTon } from '@ton/appkit';
await transferTon(appKit, { recipientAddress: '...', amount: '1.0' });
```

### `transferJetton`
Simplifies Jetton transfers by handling the master/wallet address logic and building the transfer payload.
```typescript
import { transferJetton } from '@ton/appkit';
await transferJetton(appKit, { jettonAddress: '...', recipientAddress: '...', amount: '100' });
```

### `transferNft`
A specialized action for transferring a single NFT item to another address.
```typescript
import { transferNft } from '@ton/appkit';
await transferNft(appKit, { nftAddress: '...', recipientAddress: '...' });
```

### `sendTransaction`
The most flexible way to send data. Accepts a raw `TransactionRequest` object, allowing multiple messages and custom payloads.
```typescript
import { sendTransaction } from '@ton/appkit';
await sendTransaction(appKit, { validUntil: ..., messages: [...] });
```

### `create*Transaction` helpers
These actions return a transaction object *without* sending it. Useful for UIs that need to show the transaction details or fee estimation before the user confirms.
- `createTransferTonTransaction`: Returns a TON transfer request.
- `createTransferJettonTransaction`: Returns a Jetton transfer request.
- `createTransferNftTransaction`: Returns an NFT transfer request.

## Data Fetching (Simple)

### `getBalance` / `getBalanceOfSelectedWallet`
Fetches the TON balance. `getBalanceOfSelectedWallet` is a convenience wrapper for the active wallet.
```typescript
import { getBalance } from '@ton/appkit';
const balance = await getBalance(appKit, { address: '...' });
```

### `getJettons` / `getJettonsOfSelectedWallet`
Retrieves a list of all Jetton holdings for a specific address or the active wallet.
```typescript
import { getJettons } from '@ton/appkit';
const jettons = await getJettons(appKit, { address: '...' });
```

### `getNfts`
Fetches the collection of NFTs owned by a specific address.
```typescript
import { getNfts } from '@ton/appkit';
const nfts = await getNfts(appKit, { address: '...' });
```

### `getJettonInfo`
Fetches detailed metadata (symbol, name, decimals, etc.) for a specific Jetton master address.
```typescript
import { getJettonInfo } from '@ton/appkit';
const info = await getJettonInfo(appKit, { address: '...' });
```

## Network

### `getNetworks` / `watchNetworks`
Access the current network configuration of the AppKit instance (e.g., mainnet vs testnet).
```typescript
import { getNetworks, watchNetworks } from '@ton/appkit';
```

### `getSelectedWalletNetwork`
Returns the network that the currently selected wallet is connected to.
```typescript
import { getSelectedWalletNetwork } from '@ton/appkit';
```

## Swap (DeFi)

### `getSwapManager`
Returns the `SwapManager` instance configured for the AppKit.
```typescript
import { getSwapManager } from '@ton/appkit';
const swapManager = getSwapManager(appKit);
```

### `getSwapQuote`
Fetches a price quote for swapping one asset for another from the registered DEX providers.
```typescript
import { getSwapQuote } from '@ton/appkit';
```

### `buildSwapTransaction`
Converts a quote into a sendable transaction object.
```typescript
import { buildSwapTransaction } from '@ton/appkit';
```

## Signing

Actions for requesting a digital signature from the wallet, without sending a transaction to the blockchain.

- `signText`: Requests the wallet to sign a human-readable text string.
- `signBinary`: Requests the wallet to sign raw hexadecimal or base64 data.
- `signCell`: Requests the wallet to sign a compiled TON Cell (BoC).

```typescript
import { signText } from '@ton/appkit';
const response = await signText(appKit, { text: 'Hello' });
```
