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
