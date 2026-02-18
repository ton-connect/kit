# Components

`@ton/appkit-react` provides a set of themed, ready-to-use UI components for building TON dApps.

## Providers
 
 ### `AppKitProvider`
 
 The root provider for AppKit. It must wrap your application.
 
 ```tsx
return (
    <AppKitProvider appKit={appKit}>
        {/* Your App Content */}
        <div>My App</div>
    </AppKitProvider>
);
```
 
 ## Balances

### `SendTonButton`

A specialized button for sending TON. Pre-configured for TON transfers.

```tsx
return (
    <SendTonButton
        recipientAddress="EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c"
        amount="1" // 1 TON (human-readable format)
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
        amount="5" // 5 USDT (human-readable format)
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
        request={{
            messages: [
                {
                    address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c', // Recipient address
                    amount: '100000000', // 0.1 TON in nanotons (raw format)
                    payload: beginCell()
                        .storeUint(0, 32)
                        .storeStringTail('Hello')
                        .endCell()
                        .toBoc()
                        .toString('base64') as Base64String,
                },
            ],
        }}
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

### `TonConnectButton`

A button that triggers the wallet connection flow.

```tsx
return <TonConnectButton />;
```
