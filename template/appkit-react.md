---
target: packages/appkit-react/README.md
---

# @ton/appkit-react

React components and hooks for AppKit.

## Overview

- [Initialization](#initialization)
- [Basic Usage](#basic-usage)
- [Swap](#swap)
- [Hooks](./docs/hooks.md): React hooks for wallet connection, state, and data fetching.
- [Components](./docs/components.md): UI components for AppKit.

## Installation

```bash
npm install @ton/appkit-react @tanstack/react-query @tonconnect/ui-react @ton/core @ton/crypto
```

## Dependencies

`@ton/appkit-react` requires the following peer dependencies:

-   `react` (>= 18.0.0)
-   `react-dom` (>= 18.0.0)
-   `@tanstack/react-query` (>= 5.0.0)
-   `@tonconnect/ui-react` (>= 2.4.1)

## Initialization

Initialize `QueryClient` and `AppKit`, then wrap your application in `QueryClientProvider` and `AppKitProvider`.

> [!NOTE]
> Don't forget to import styles from `@ton/appkit-react/styles.css`.

%%demo/examples/src/appkit#APPKIT_REACT_INIT%%
[Read more about TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview)

### TonConnect Configuration

When using `TonConnectConnector`, you can pass `tonConnectOptions` which accepts standard [TonConnectUI options](https://github.com/ton-connect/sdk/tree/main/packages/ui-react#parameters), including `manifestUrl`, `uiOptions`, etc.

## Basic Usage

### Connect Wallet

Use `TonConnectButton` to allow users to connect their wallets. It handles the connection flow and UI.

```tsx
import { TonConnectButton } from '@ton/appkit-react';

export const Header = () => {
    return (
        <header>
            <TonConnectButton />
        </header>
    );
};
```

### Get Wallet Address

Use `useAddress` to get the currently connected wallet address.

```tsx
import { useAddress } from '@ton/appkit-react';

export const AddressBlock = () => {
    const address = useAddress();

    if (!address) {
        return <div>Wallet not connected</div>;
    }

    return <div>Address: {address}</div>;
};
```

### Get Balance

Use `useBalance` to fetch the TON balance of the connected wallet.

```tsx
import { useBalance } from '@ton/appkit-react';

export const Balance = () => {
    const { data: balance, isLoading } = useBalance();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    return <div>Balance: {balance?.toString()} TON</div>;
};
```

> See [Hooks Documentation](./docs/hooks.md) for all available hooks and [Components Documentation](./docs/components.md) for UI components.

## Swap

AppKit supports swapping assets through `OmnistonSwapProvider`.

### Installation

```bash
npm install @ston-fi/omniston-sdk
```

### Setup

Initialize `AppKit` with `OmnistonSwapProvider`:

%%demo/examples/src/appkit/swap#SWAP_PROVIDER_INIT%%

### Hooks

Use `useSwapQuote` to get a quote and `useBuildSwapTransaction` to build the transaction.

See [Swap Hooks](./docs/hooks.md#swap) for usage examples.

## Migration from TonConnect UI

`AppKitProvider` automatically bridges TonConnect if a `TonConnectConnector` is configured, so `@tonconnect/ui-react` hooks (like `useTonAddress`, `useTonWallet`, etc.) work out of the box inside `AppKitProvider`.

You can use standard TonConnect hooks in your components:

%%demo/examples/src/appkit#APPKIT_REACT_TONCONNECT_HOOKS%%

## License

MIT
