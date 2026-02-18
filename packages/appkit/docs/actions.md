# Actions

AppKit provides a set of actions to interact with the blockchain and wallets.

## Balances

### `getBalance`

Get the TON balance of the currently selected wallet.

```ts
const balance = await getBalance(appKit);
if (balance) {
    console.log('Balance:', balance.toString());
}
```

### `getBalanceByAddress`

Fetch the TON balance of a specific address.

```ts
const balanceByAddress = await getBalanceByAddress(appKit, {
    address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c', // Zero Address
});
console.log('Balance by address:', balanceByAddress.toString());
```

## Connectors

### `connect`

Connect a wallet using a specific connector.

```ts
await connect(appKit, {
    connectorId: 'tonconnect',
});
```

### `addConnector`

Add a wallet connector to AppKit (e.g., TonConnect).

```ts
const stopWatching = addConnector(
    appKit,
    new TonConnectConnector({
        tonConnectOptions: {
            manifestUrl: 'https://tonconnect-sdk-demo-dapp.vercel.app/tonconnect-manifest.json',
        },
    }),
);

// Later: stopWatching();
```

### `disconnect`

Disconnect a wallet using a specific connector.

```ts
await disconnect(appKit, {
    connectorId: 'tonconnect',
});
```

### `getConnectors`

Get all available connectors.

```ts
const connectors = getConnectors(appKit);
connectors.forEach((connector) => {
    console.log('Connector:', connector.id);
});
```

### `getConnectorById`

Get a specific connector by its ID.

```ts
const connector = getConnectorById(appKit, {
    id: 'tonconnect',
});

if (connector) {
    console.log('Found connector:', connector.id);
}
```

### `watchConnectors`

Watch for changes in available connectors (e.g., when a wallet connects).

```ts
const unsubscribe = watchConnectors(appKit, {
    onChange: (connectors) => {
        console.log('Connectors updated:', connectors);
    },
});

// Later: unsubscribe();
```

### `watchConnectorById`

Watch for changes in a specific connector.

```ts
const unsubscribe = watchConnectorById(appKit, {
    id: 'tonconnect',
    onChange: (connector) => {
        console.log('Connector updated:', connector);
    },
});

// Later: unsubscribe();
```

## Jettons

### `getJettons`

Get all jettons owned by the currently selected wallet.

```ts
const response = await getJettons(appKit);
if (!response) {
    console.log('No wallet selected or no jettons found');
    return;
}
console.log('Jettons:', response.jettons.length);
response.jettons.forEach((j) => console.log(`- ${j.info.name}: ${j.balance.toString()}`));
```

### `getJettonsByAddress`

Get all jettons owned by a specific address.

```ts
const selectedWallet = getSelectedWallet(appKit);
if (!selectedWallet) {
    console.log('No wallet selected');
    return;
}

const response = await getJettonsByAddress(appKit, {
    address: selectedWallet.getAddress(),
});
console.log('Jettons by Address:', response.jettons.length);
response.jettons.forEach((j) => console.log(`- ${j.info.name}: ${j.balance.toString()}`));
```

### `getJettonBalance`

Get the balance of a specific jetton for a wallet address.

```ts
const selectedWallet = getSelectedWallet(appKit);
if (!selectedWallet) {
    console.log('No wallet selected');
    return;
}

const balance = await getJettonBalance(appKit, {
    jettonAddress: 'EQDBE420tTQIkoWcZ9pEOTKY63WVmwyIl3hH6yWl0r_h51Tl',
    ownerAddress: selectedWallet.getAddress(),
    jettonDecimals: 6,
});
console.log('Jetton Balance:', balance.toString());
```

### `getJettonInfo`

Get information about a specific jetton by its address.

```ts
const info = await getJettonInfo(appKit, {
    address: 'EQDBE420tTQIkoWcZ9pEOTKY63WVmwyIl3hH6yWl0r_h51Tl',
});
console.log('Jetton Info:', info);
```

### `getJettonWalletAddress`

Get the jetton wallet address for a specific jetton and owner address.

```ts
const selectedWallet = getSelectedWallet(appKit);
if (!selectedWallet) {
    console.log('No wallet selected');
    return;
}

const address = await getJettonWalletAddress(appKit, {
    jettonAddress: 'EQDBE420tTQIkoWcZ9pEOTKY63WVmwyIl3hH6yWl0r_h51Tl',
    ownerAddress: selectedWallet.getAddress(),
});
console.log('Jetton Wallet Address:', address);
```

### `createTransferJettonTransaction`

Create a transaction for transferring jettons without sending it.

```ts
const tx = await createTransferJettonTransaction(appKit, {
    jettonAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
    recipientAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    amount: '100', // 100 USDT
    comment: 'Hello Jetton',
    jettonDecimals: 6,
});
console.log('Transfer Transaction:', tx);
```

### `transferJetton`

Transfer jettons to a recipient address.

```ts
const result = await transferJetton(appKit, {
    jettonAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
    recipientAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    amount: '100',
    jettonDecimals: 6,
});
console.log('Transfer Result:', result);
```

## Networks

### `getNetwork`

Get the network of the currently selected wallet.

```ts
const network = getNetwork(appKit);

if (network) {
    console.log('Current network:', network);
}
```

### `getNetworks`

Get all configured networks.

```ts
const networks = getNetworks(appKit);

console.log('Configured networks:', networks);
```

### `watchNetworks`

Watch configured networks.

```ts
const unsubscribe = watchNetworks(appKit, {
    onChange: (networks) => {
        console.log('Networks updated:', networks);
    },
});

// Later: unsubscribe();
```

## NFTs

### `getNfts`

Get all NFTs owned by the currently selected wallet.

```ts
const response = await getNfts(appKit);

if (response) {
    console.log('Total NFTs:', response.nfts.length);
    response.nfts.forEach((nft) => console.log(`- ${nft.info?.name}`));
}
```

### `getNftsByAddress`

Get all NFTs owned by a specific address.

```ts
const response = await getNftsByAddress(appKit, {
    address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c', // Zero Address
});

console.log('NFTs by address:', response.nfts.length);
```

### `getNft`

Get information about a specific NFT by its address.

```ts
const nft = await getNft(appKit, {
    address: 'EQCA14o1-VWhS29szfbpmbu_m7A_9S4m_Ba6sAyALH_mU68j',
});

if (nft) {
    console.log('NFT Name:', nft.info?.name);
    console.log('NFT Collection:', nft.collection?.name);
}
```

### `createTransferNftTransaction`

Create a transaction for transferring a NFT without sending it.

```ts
const tx = await createTransferNftTransaction(appKit, {
    nftAddress: 'EQCA14o1-VWhS29szfbpmbu_m7A_9S4m_Ba6sAyALH_mU68j',
    recipientAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    comment: 'Gift NFT',
});

console.log('NFT Transfer Transaction:', tx);
```

### `transferNft`

Transfer a NFT to a recipient address.

```ts
const result = await transferNft(appKit, {
    nftAddress: 'EQCA14o1-VWhS29szfbpmbu_m7A_9S4m_Ba6sAyALH_mU68j',
    recipientAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
});

console.log('NFT Transfer Result:', result);
```

## Providers

### `registerProvider`

Register a custom token swap provider in AppKit (e.g., Omniston).

```ts
const omnistonProvider = new OmnistonSwapProvider({
    defaultSlippageBps: 100, // 1%
});

registerProvider(appKit, omnistonProvider);
```

## Signing

### `signText`

Sign a text message with the connected wallet.

```ts
const result = await signText(appKit, {
    text: 'Hello, TON!',
});

console.log('Signature:', result.signature);
```

### `signBinary`

Sign binary data with the connected wallet.

```ts
// Example: sign "Hello" in base64
const result = await signBinary(appKit, {
    bytes: 'SGVsbG8=' as Base64String,
});

console.log('Binary Signature:', result.signature);
```

### `signCell`

Sign a TON Cell with the connected wallet. Used for on-chain signature verification.

```ts
const result = await signCell(appKit, {
    cell: 'te6ccgEBAQEAAgAAGA==' as Base64String, // Example BOC
    schema: 'transfer#abc123 amount:uint64 = Transfer',
});

console.log('Cell Signature:', result.signature);
```

## Swap

### `getSwapManager`

Get the `SwapManager` instance to interact with swap providers directly.

```ts
const swapManager = getSwapManager(appKit);
```

### `getSwapQuote`

Get a swap quote from registered providers.

```ts
const quote = await getSwapQuote(appKit, {
    from: {
        address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
        decimals: 6,
    },
    to: { address: 'ton', decimals: 9 },
    amount: '1000000000', // nanotons as string
    network: Network.mainnet(),
});
console.log('Swap Quote:', quote);
```

### `buildSwapTransaction`

Build (assemble) a swap transaction based on a quote. After the transaction is built, you can use `sendTransaction` to execute it on the blockchain.

```ts
const transactionRequest = await buildSwapTransaction(appKit, {
    quote,
    userAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    slippageBps: 100, // 1%
});
const transactionResponse = await sendTransaction(appKit, transactionRequest);
console.log('Swap Transaction:', transactionResponse);
```

## Transaction

### `createTransferTonTransaction`
 
Create a TON transfer transaction request without sending it.
 
```ts
const tx = await createTransferTonTransaction(appKit, {
    recipientAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    amount: '0.1', // 0.1 TON (human-readable format)
    comment: 'Draft transaction',
});

console.log('Transaction Request:', tx);
```

### `sendTransaction`
 
Send a transaction to the blockchain.
 
```ts
const result = await sendTransaction(appKit, {
    messages: [
        {
            address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
            amount: '100000000', // 0.1 TON in nanotons (raw format)
        },
    ],
});

console.log('Transaction Result:', result);
```
 
### `transferTon`
 
Transfer TON to a recipient address.
 
```ts
const result = await transferTon(appKit, {
    recipientAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    amount: '0.1', // 0.1 TON (human-readable format)
    comment: 'Hello from AppKit!',
});

console.log('Transfer Result:', result);
```

## Wallets

### `getConnectedWallets`

Get all connected wallets.

```ts
const wallets = getConnectedWallets(appKit);

console.log('Connected wallets:', wallets);
```

### `getSelectedWallet`

Get the currently selected wallet.

```ts
const wallet = getSelectedWallet(appKit);

if (wallet) {
    console.log('Selected wallet:', wallet.getWalletId());
    console.log('Address:', wallet.getAddress());
}
```

### `setSelectedWalletId`

Set the currently selected wallet by its ID.

```ts
setSelectedWalletId(appKit, {
    walletId: 'my-wallet-id',
});
```

### `watchConnectedWallets`

Watch for changes in the list of connected wallets.

```ts
const unsubscribe = watchConnectedWallets(appKit, {
    onChange: (wallets) => {
        console.log('Connected wallets updated:', wallets.length);
    },
});

// Later: unsubscribe();
```

### `watchSelectedWallet`

Watch for changes in the selected wallet.

```ts
const unsubscribe = watchSelectedWallet(appKit, {
    onChange: (wallet) => {
        if (wallet) {
            console.log('Selected wallet changed:', wallet.getWalletId());
        } else {
            console.log('Wallet deselected');
        }
    },
});

// Later: unsubscribe();
```
