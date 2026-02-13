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
