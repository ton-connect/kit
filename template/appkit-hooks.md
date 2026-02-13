---
target: packages/appkit-react/docs/hooks.md
---

# Hooks

AppKit React provides a set of hooks to interact with the blockchain and wallets.

## Balances

### `useBalance`

Hook to get the TON balance of the currently selected wallet.

%%demo/examples/src/appkit/hooks/balances#USE_BALANCE%%

### `useBalanceByAddress`

Hook to fetch the TON balance of a specific address.

%%demo/examples/src/appkit/hooks/balances#USE_BALANCE_BY_ADDRESS%%

## Jettons

### `useJettons`

Hook to get all jettons owned by the currently selected wallet.

%%demo/examples/src/appkit/hooks/jettons#USE_JETTONS%%

### `useJettonsByAddress`

Hook to get all jettons owned by a specific address.

%%demo/examples/src/appkit/hooks/jettons#USE_JETTONS_BY_ADDRESS%%

### `useJettonBalanceByAddress`

Hook to get the balance of a specific jetton for a wallet address.

%%demo/examples/src/appkit/hooks/jettons#USE_JETTON_BALANCE_BY_ADDRESS%%

### `useJettonInfo`

Hook to get information about a specific jetton by its address.

%%demo/examples/src/appkit/hooks/jettons#USE_JETTON_INFO%%

### `useJettonWalletAddress`

Hook to get the jetton wallet address for a specific jetton and owner address.

%%demo/examples/src/appkit/hooks/jettons#USE_JETTON_WALLET_ADDRESS%%

### `useTransferJetton`

Hook to transfer jettons to a recipient address.

```tsx
%%demo/examples/src/appkit/hooks/jettons#USE_TRANSFER_JETTON%%
```

## Network

### `useNetwork`

Hook to get network of the selected wallet.

```tsx
%%demo/examples/src/appkit/hooks/network#USE_NETWORK%%
```

### `useNetworks`

Hook to get all configured networks.

```tsx
%%demo/examples/src/appkit/hooks/network#USE_NETWORKS%%
```
