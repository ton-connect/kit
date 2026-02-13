# Components

`@ton/appkit-react` provides a set of themed, ready-to-use UI components for building TON dApps.

## Balances

### `SendTonButton`

A specialized button for sending TON. Pre-configured for TON transfers.

```tsx
return (
    <SendTonButton
        recipientAddress="EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"
        amount="1000000000" // 1 TON
        comment="Hello from AppKit"
        onSuccess={(result) => console.log('Transaction sent:', result)}
        onError={(error) => console.error('Transaction failed:', error)}
    />
);
```

### `SendJettonButton`

A specialized button for sending Jettons. Handles jetton-specific logic.

```tsx
return (
    <SendJettonButton
        recipientAddress="EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"
        amount="5000000" // 5 USDT
        comment="Payment for services"
        jetton={{
            address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', // USDT
            symbol: 'USDT',
            decimals: 6,
        }}
        onSuccess={(result) => console.log('Transaction sent:', result)}
        onError={(error) => console.error('Transaction failed:', error)}
    />
);
```

## Transactions

### `Transaction`

A drop-in component that handles the entire transaction flow.

```tsx
return (
    <Transaction
        getTransactionRequest={async () => ({
            validUntil: Math.floor(Date.now() / 1000) + 600,
            messages: [
                {
                    address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c', // Recipient address
                    amount: '100000000', // 0.1 TON
                    payload: beginCell().storeUint(0, 32).storeStringTail('Hello').endCell().toBoc().toString('base64'),
                },
            ],
        })}
        text="Send Transaction"
        onSuccess={(result) => {
            console.log('Transaction sent:', result);
        }}
        onError={(error) => {
            console.error('Transaction failed:', error);
        }}
    />
);
```

## Wallets

### `ConnectButton`

A button that triggers the wallet connection flow.

```tsx
return <ConnectButton />;
```
