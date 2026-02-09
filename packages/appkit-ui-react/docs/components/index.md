# Components

Beyond the `Transaction` component, `@ton/appkit-ui-react` provides several other UI components.

## Wallet Connection

### `ConnectButton`

A button that triggers the wallet connection flow.

```tsx
import { ConnectButton } from '@ton/appkit-ui-react';

function Header() {
    return (
        <header>
            <ConnectButton />
        </header>
    );
}
```

## Asset Display

The library also export components for displaying assets, though they are primarily used internally or in specific feature contexts.

- **`JettonItem`**: Displays a single Jetton.
- **`NftItem`**: Displays a single NFT.
- **`TransferTon`**: UI for transferring TON.
- **`TransferJetton`**: UI for transferring Jettons.
- **`TransferNft`**: UI for transferring NFTs.

*Note: These feature-specific components are often used within the `Transaction` flow or as part of larger feature blocks.*
