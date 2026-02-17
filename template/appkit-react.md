---
target: packages/appkit-react/README.md
---

# @ton/appkit-react

React components and hooks for AppKit.

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

Wrap your application in `AppKitProvider` and pass the `AppKit` instance.

> [!NOTE]
> Don't forget to import styles from `@ton/appkit-react/styles.css`.

%%demo/examples/src/appkit#APPKIT_REACT_INIT%%

### Setup TanStack Query

Wrap your application in `QueryClientProvider` from `@tanstack/react-query` inside `AppKitProvider`.

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppKitProvider } from '@ton/appkit-react';

const queryClient = new QueryClient();

// ... appKit initialization

function App() {
    return (
        <AppKitProvider appKit={appKit}>
            <QueryClientProvider client={queryClient}>
                {/* ... */}
            </QueryClientProvider>
        </AppKitProvider>
    );
}
```

[Read more about TanStack Query](https://tanstack.com/query/latest/docs/framework/react/overview)

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

## Documentation

- [Hooks](./docs/hooks.md): React hooks for wallet connection, state, and data fetching.
- [Components](./docs/components.md): UI components for AppKit.

## License

MIT
