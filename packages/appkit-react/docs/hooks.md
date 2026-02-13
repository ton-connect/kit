# Hooks

AppKit React provides a set of hooks to interact with the blockchain and wallets.

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
        amount: '1000000000', // 1 Jetton (assuming 9 decimals)
        jettonAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiXme1Xc56Iwobkzgnjj',
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
