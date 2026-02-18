# Hooks

AppKit React provides a set of hooks to interact with the blockchain and wallets.

## Core
 
 ### `useAppKit`
 
 Hook to access the `AppKit` instance.
 
 ```ts
const appKit = useAppKit();
```
 
 ### `useAppKitTheme`
 
 Hook to access and toggle the current theme.
 
 ```tsx
const [theme, setTheme] = useAppKitTheme();

return (
    <div>
        <h3>Current Theme: {theme}</h3>
        <button onClick={() => setTheme('dark')}>Set Dark Theme</button>
        <button onClick={() => setTheme('light')}>Set Light Theme</button>
    </div>
);
```
 
 ## Balances

### `useBalance`

Hook to get the TON balance of the currently selected wallet.

```tsx
const { data: balance, isLoading, error } = useBalance();

if (isLoading) {
    return <div>Loading...</div>;
}

if (error) {
    return <div>Error: {error.message}</div>;
}

return <div>Balance: {balance?.toString()}</div>;
```

### `useBalanceByAddress`

Hook to fetch the TON balance of a specific address.

```tsx
const {
    data: balance,
    isLoading,
    error,
} = useBalanceByAddress({
    address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
});

if (isLoading) {
    return <div>Loading...</div>;
}

if (error) {
    return <div>Error: {error.message}</div>;
}

return <div>Balance: {balance?.toString()}</div>;
```

## Jettons

### `useJettons`

Hook to get all jettons owned by the currently selected wallet.

```tsx
const { data: jettons, isLoading, error } = useJettons();

if (isLoading) {
    return <div>Loading...</div>;
}

if (error) {
    return <div>Error: {error.message}</div>;
}

return (
    <div>
        <h3>Jettons</h3>
        <ul>
            {jettons?.jettons.map((jetton) => (
                <li key={jetton.walletAddress}>
                    {jetton.info.name}: {jetton.balance}
                </li>
            ))}
        </ul>
    </div>
);
```

### `useJettonsByAddress`

Hook to get all jettons owned by a specific address.

```tsx
const {
    data: jettons,
    isLoading,
    error,
} = useJettonsByAddress({
    address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
});

if (isLoading) {
    return <div>Loading...</div>;
}

if (error) {
    return <div>Error: {error.message}</div>;
}

return (
    <div>
        <h3>Jettons</h3>
        <ul>
            {jettons?.jettons.map((jetton) => (
                <li key={jetton.walletAddress}>
                    {jetton.info.name}: {jetton.balance}
                </li>
            ))}
        </ul>
    </div>
);
```

### `useJettonBalanceByAddress`

Hook to get the balance of a specific jetton for a wallet address.

```tsx
const {
    data: balance,
    isLoading,
    error,
} = useJettonBalanceByAddress({
    ownerAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    jettonAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiXme1Xc56Iwobkzgnjj',
});

if (isLoading) {
    return <div>Loading...</div>;
}

if (error) {
    return <div>Error: {error.message}</div>;
}

return <div>Jetton Balance: {balance}</div>;
```

### `useJettonInfo`

Hook to get information about a specific jetton by its address.

```tsx
const {
    data: info,
    isLoading,
    error,
} = useJettonInfo({
    address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiXme1Xc56Iwobkzgnjj',
});

if (isLoading) {
    return <div>Loading...</div>;
}

if (error) {
    return <div>Error: {error.message}</div>;
}

return (
    <div>
        <h3>Jetton Info</h3>
        <p>Name: {info?.name}</p>
        <p>Symbol: {info?.symbol}</p>
        <p>Decimals: {info?.decimals}</p>
    </div>
);
```

### `useJettonWalletAddress`

Hook to get the jetton wallet address for a specific jetton and owner address.

```tsx
const {
    data: walletAddress,
    isLoading,
    error,
} = useJettonWalletAddress({
    ownerAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    jettonAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiXme1Xc56Iwobkzgnjj',
});

if (isLoading) {
    return <div>Loading...</div>;
}

if (error) {
    return <div>Error: {error.message}</div>;
}

return <div>Jetton Wallet Address: {walletAddress?.toString()}</div>;
```

### `useTransferJetton`

Hook to transfer jettons to a recipient address.

```tsx
const { mutate: transfer, isPending, error } = useTransferJetton();

const handleTransfer = () => {
    transfer({
        recipientAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
        amount: '100', // 100 USDT
        jettonAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
        jettonDecimals: 6,
    });
};

return (
    <div>
        <button onClick={handleTransfer} disabled={isPending}>
            {isPending ? 'Transferring...' : 'Transfer Jetton'}
        </button>
        {error && <div>Error: {error.message}</div>}
    </div>
);
```

## Network

### `useNetwork`

Hook to get network of the selected wallet.

```tsx
const network = useNetwork();

if (!network) {
    return <div>Network not selected</div>;
}

return <div>Current Network: {network.chainId}</div>;
```

### `useNetworks`

Hook to get all configured networks.

```tsx
const networks = useNetworks();

return (
    <div>
        <h3>Available Networks</h3>
        <ul>
            {networks.map((network) => (
                <li key={network.chainId}>{network.chainId}</li>
            ))}
        </ul>
    </div>
);
```

## NFT

### `useNft`

Hook to get a single NFT.

```tsx
const {
    data: nft,
    isLoading,
    error,
} = useNft({
    address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
});

if (isLoading) {
    return <div>Loading...</div>;
}

if (error) {
    return <div>Error: {error.message}</div>;
}

return (
    <div>
        <h3>NFT Details</h3>
        <p>Name: {nft?.info?.name}</p>
        <p>Collection: {nft?.collection?.name}</p>
        <p>Owner: {nft?.ownerAddress?.toString()}</p>
    </div>
);
```

### `useNfts`

Hook to get NFTs of the selected wallet.

```tsx
const {
    data: nfts,
    isLoading,
    error,
} = useNfts({
    limit: 10,
});

if (isLoading) {
    return <div>Loading...</div>;
}

if (error) {
    return <div>Error: {error.message}</div>;
}

return (
    <div>
        <h3>My NFTs</h3>
        <ul>
            {nfts?.nfts.map((nft) => (
                <li key={nft.address.toString()}>
                    {nft.info?.name} ({nft.collection?.name})
                </li>
            ))}
        </ul>
    </div>
);
```

### `useNFTsByAddress`

Hook to get NFTs of a specific address.

```tsx
const {
    data: nfts,
    isLoading,
    error,
} = useNFTsByAddress({
    address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    limit: 10,
});

if (isLoading) {
    return <div>Loading...</div>;
}

if (error) {
    return <div>Error: {error.message}</div>;
}

return (
    <div>
        <h3>NFTs</h3>
        <ul>
            {nfts?.nfts.map((nft) => (
                <li key={nft.address.toString()}>
                    {nft.info?.name} ({nft.collection?.name})
                </li>
            ))}
        </ul>
    </div>
);
```

### `useTransferNft`

Hook to transfer NFT to another wallet.

```tsx
const { mutate: transfer, isPending, error } = useTransferNft();

const handleTransfer = () => {
    transfer({
        nftAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
        recipientAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
        comment: 'Gift for you',
    });
};

return (
    <div>
        <button onClick={handleTransfer} disabled={isPending}>
            {isPending ? 'Transferring...' : 'Transfer NFT'}
        </button>
        {error && <div>Error: {error.message}</div>}
    </div>
);
```

## Signing

### `useSignBinary`

Hook to sign binary data with the connected wallet.

```tsx
const { mutate: signBinary, isPending, error, data } = useSignBinary();

const handleSign = () => {
    // Sign "Hello" in binary (Base64: SGVsbG8=)
    signBinary({ bytes: 'SGVsbG8=' as Base64String });
};

return (
    <div>
        <button onClick={handleSign} disabled={isPending}>
            {isPending ? 'Signing...' : 'Sign Binary'}
        </button>
        {error && <div>Error: {error.message}</div>}
        {data && (
            <div>
                <h4>Signature:</h4>
                <pre>{data.signature}</pre>
            </div>
        )}
    </div>
);
```

### `useSignCell`

Hook to sign TON Cell data with the connected wallet.

```tsx
const { mutate: signCell, isPending, error, data } = useSignCell();

const handleSign = () => {
    signCell({
        cell: 'te6cckEBAQEAAgAAAEysuc0=' as Base64String, // Empty cell
        schema: 'nothing#0 = Nothing',
    });
};

return (
    <div>
        <button onClick={handleSign} disabled={isPending}>
            {isPending ? 'Signing...' : 'Sign Cell'}
        </button>
        {error && <div>Error: {error.message}</div>}
        {data && (
            <div>
                <h4>Signature:</h4>
                <pre>{data.signature}</pre>
            </div>
        )}
    </div>
);
```

### `useSignText`

Hook to sign text messages with the connected wallet.

```tsx
const { mutate: signText, isPending, error, data } = useSignText();

const handleSign = () => {
    signText({ text: 'Hello, TON!' });
};

return (
    <div>
        <button onClick={handleSign} disabled={isPending}>
            {isPending ? 'Signing...' : 'Sign Text'}
        </button>
        {error && <div>Error: {error.message}</div>}
        {data && (
            <div>
                <h4>Signature:</h4>
                <pre>{data.signature}</pre>
            </div>
        )}
    </div>
);
```

## Swap

### `useSwapQuote`

Hook to get a swap quote for a token pair.

```tsx
const {
    data: quote,
    isLoading,
    error,
} = useSwapQuote({
    from: { address: 'ton', decimals: 9 },
    to: {
        address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
        decimals: 6,
    }, // USDT
    amount: '1', // human-readable amount as string
});

if (isLoading) {
    return <div>Loading quote...</div>;
}

if (error) {
    return <div>Error: {error.message}</div>;
}

return (
    <div>
        <h3>Swap Quote</h3>
        {quote && (
            <div>
                <p>Expected Output: {quote.toAmount}</p>
                <p>Price Impact: {quote.priceImpact}</p>
            </div>
        )}
    </div>
);
```

### `useBuildSwapTransaction`

Hook to build a transaction for a swap operation based on a quote.

```tsx
// First, get a quote
const { data: quote } = useSwapQuote({
    from: { address: 'ton', decimals: 9 },
    to: {
        address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
        decimals: 6,
    },
    amount: '1', // human-readable amount as string
    network: Network.mainnet(),
});

// Valid only for building the transaction
const { mutateAsync: buildTx, isPending: isBuilding } = useBuildSwapTransaction();

// Valid for sending the transaction
const { mutateAsync: sendTx, isPending: isSending } = useSendTransaction();

const handleSwap = async () => {
    if (!quote) {
        return;
    }

    try {
        // Build the transaction
        const transaction = await buildTx({
            quote,
            userAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c', // User's wallet address
            slippageBps: 100, // 1%
        });

        // Send the transaction
        await sendTx(transaction);
    } catch (e) {
        console.error(e);
    }
};

const isPending = isBuilding || isSending;

return (
    <div>
        <button onClick={handleSwap} disabled={!quote || isPending}>
            {isPending ? 'Processing...' : 'Swap'}
        </button>
    </div>
);
```

## Transaction

### `useSendTransaction`

Hook to send a transaction to the blockchain.

```tsx
const { mutate: sendTransaction, isPending, error, data } = useSendTransaction();

const handleSendStructure = () => {
    // Send a transaction with a specific structure
    sendTransaction({
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes from now
        messages: [
            {
                address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
                amount: '1000000000', // 1 TON in nanotons
                payload: 'te6cckEBAQEAAgAAAEysuc0=' as Base64String, // Optional payload (cell)
            },
        ],
    });
};

return (
    <div>
        <button onClick={handleSendStructure} disabled={isPending}>
            {isPending ? 'Sending...' : 'Send Transaction'}
        </button>
        {error && <div>Error: {error.message}</div>}
        {data && (
            <div>
                <h4>Transaction Sent!</h4>
                <p>BOC: {data.boc}</p>
            </div>
        )}
    </div>
);
```

### `useTransferTon`

Hook to simplify transferring TON to another address.

```tsx
const { mutate: transferTon, isPending, error, data } = useTransferTon();

const handleTransfer = () => {
    transferTon({
        recipientAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
        amount: '1', // 1 TON (human-readable format)
        comment: 'Hello from AppKit!',
    });
};

return (
    <div>
        <button onClick={handleTransfer} disabled={isPending}>
            {isPending ? 'Transferring...' : 'Transfer TON'}
        </button>
        {error && <div>Error: {error.message}</div>}
        {data && (
            <div>
                <h4>Transfer Successful!</h4>
                <p>BOC: {data.boc}</p>
            </div>
        )}
    </div>
);
```

## Wallets

### `useAddress`

Hook to get current wallet address.

```tsx
const address = useAddress();

if (!address) {
    return <div>Wallet not connected</div>;
}

return <div>Current Address: {address}</div>;
```

### `useConnect`

Hook to connect a wallet.

```tsx
const [wallet] = useSelectedWallet();
const { mutate: connect, isPending: isConnecting, error: connectError } = useConnect();
const { mutate: disconnect, isPending: isDisconnecting } = useDisconnect();

if (wallet) {
    return (
        <div>
            <button
                onClick={() => {
                    disconnect({ connectorId: wallet.connectorId });
                }}
                disabled={isDisconnecting}
            >
                {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
            </button>
        </div>
    );
}

return (
    <div>
        <button onClick={() => connect({ connectorId: 'tonconnect' })} disabled={isConnecting}>
            {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
        {connectError && <div>Error: {connectError.message}</div>}
    </div>
);
```

### `useConnectedWallets`

Hook to get all connected wallets.

```tsx
const connectedWallets = useConnectedWallets();

return (
    <div>
        <h3>Connected Wallets:</h3>
        <ul>
            {connectedWallets.map((wallet) => (
                <li key={wallet.getAddress()}>
                    {wallet.getAddress()} ({wallet.getNetwork().toString()})
                </li>
            ))}
        </ul>
    </div>
);
```

### `useConnectorById`

Hook to get a connector by its ID.

```tsx
const connector = useConnectorById('injected');

if (!connector) {
    return <div>Injected connector not found</div>;
}

return (
    <div>
        <h3>Connector Details:</h3>
        <p>ID: {connector.id}</p>
        <p>Type: {connector.type}</p>
    </div>
);
```

### `useConnectors`

Hook to get all available connectors.

```tsx
const connectors = useConnectors();
const { mutate: connect } = useConnect();

return (
    <div>
        <h3>Available Connectors:</h3>
        <ul>
            {connectors.map((connector) => (
                <li key={connector.id}>
                    <button onClick={() => connect({ connectorId: connector.id })}>{connector.type}</button>
                </li>
            ))}
        </ul>
    </div>
);
```

### `useDisconnect`

Hook to disconnect a wallet.

```tsx
const [wallet] = useSelectedWallet();
const { mutate: disconnect, isPending, error } = useDisconnect();

if (!wallet) {
    return <div>Wallet not connected</div>;
}

return (
    <div>
        <p>Connected: {wallet.getAddress()}</p>
        <button
            onClick={() => {
                disconnect({ connectorId: wallet.connectorId });
            }}
            disabled={isPending}
        >
            {isPending ? 'Disconnecting...' : 'Disconnect'}
        </button>
        {error && <div>Error: {error.message}</div>}
    </div>
);
```

### `useSelectedWallet`

Hook to get and set the currently selected wallet.

```tsx
const [wallet, setSelectedWallet] = useSelectedWallet();

return (
    <div>
        {wallet ? (
            <div>
                <p>Current Wallet: {wallet.getAddress()}</p>
                <button onClick={() => setSelectedWallet(null)}>Deselect Wallet</button>
            </div>
        ) : (
            <p>No wallet selected</p>
        )}
    </div>
);
```


