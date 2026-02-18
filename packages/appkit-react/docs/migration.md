# Migration from TonConnect UI React

## Steps

1. Install dependencies:

```bash
pnpm add @ton/appkit-react @tanstack/react-query
```

2. Create the `AppKit` instance with your existing TonConnect options:

```tsx
import { TonConnectConnector, AppKit } from '@ton/appkit-react';

const appKit = new AppKit({
    connectors: [
        new TonConnectConnector({
            tonConnectOptions: {
                manifestUrl: 'https://tonconnect-sdk-demo-dapp.vercel.app/tonconnect-manifest.json',
            },
        }),
    ],
});
```

3. Replace `<TonConnectUIProvider>` with `<AppKitProvider>` and add `<QueryClientProvider>`:

```tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppKitProvider } from '@ton/appkit-react';

import '@ton/appkit-react/styles.css';

const queryClient = new QueryClient();

function App() {
    return (
        <AppKitProvider appKit={appKit}>
            <QueryClientProvider client={queryClient}>
                {/* ...Rest of the app... */}
            </QueryClientProvider>
        </AppKitProvider>
    );
}
```

4. Existing `@tonconnect/ui-react` hooks (`useTonAddress`, `useTonWallet`, etc.) will continue to work inside `AppKitProvider` automatically, since it bridges TonConnect under the hood.
