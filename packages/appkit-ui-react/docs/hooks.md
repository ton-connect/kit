# AppKit UI React Hooks & Components

`@ton/appkit-ui-react` provides a React-friendly interface to AppKit, leveraging TanStack Query for data fetching and providing beautiful, themed UI components.

## Core Hooks

### `useAppKit`
Returns the global AppKit instance. Useful when you need to call standalone actions directly.

### `useAppKitTheme`
Returns the current theme (`'light'` or `'dark'`) and a function to switch it.

### `useI18n`
Provides access to the internationalization context, allowing you to change language or access translated strings.

## Wallet & Connection

### `useConnect` / `useDisconnect`
Hooks to programmatically trigger the connection or disconnection flows.

### `useConnectors`
Returns a list of all available wallet connection providers (e.g., TonConnect, Ledger).

### `useConnectedWallets`
A reactive hook that returns an array of all currently connected wallets.

### `useSelectedWallet`
Returns the currently "active" wallet that the user is interacting with.

## Asset Hooks

These hooks are reactive and will automatically update when the balance or asset list changes.

### `useBalance` / `useSelectedWalletBalance`
Fetch TON balance. `useSelectedWalletBalance` is a zero-config hook for the active wallet.

### `useJettons` / `useSelectedWalletJettons`
Fetch the list of Jettons. `useSelectedWalletJettons` handles the address logic for you.

### `useJettonInfo`
Fetches metadata (name, decimals) for a specific Jetton.

### `useNfts` / `useSelectedWalletNfts`
Fetch NFTs. `useSelectedWalletNfts` lists NFTs for the currently connected wallet.

## Transaction Hooks

Reactive hooks for performing operations with built-in loading and error states.

### `useSendTransaction`
The general-purpose hook for sending any transaction request.

### `useTransferTon` / `useTransferJetton` / `useTransferNft`
Convenience hooks for specific asset transfers.

### `useSwapQuote` / `useBuildSwapTransaction`
Hooks for integrating DEX swap functionality into your UI.

## Signing Hooks

### `useSignText` / `useSignBinary` / `useSignCell`
Hooks for requesting digital signatures from the connected wallet.

---

## UI Components

### `ConnectButton`
The standard, themed button for wallet connection. It shows the wallet's address or name when connected.

### `ChooseConnectorModal` / `ConnectorsList`
Low-level components to build a custom wallet selection interface.

### `BalanceBadge`
A compact UI element displaying the TON balance with a currency icon.

### `Transaction`
A drop-in component that handles the entire transaction flow: building the request, showing the confirmation, and displaying success/error states.

### `SendButton`
A context-aware button that can be configured for different types of transfers.

### `Button` / `Block` / `Modal`
The base building blocks of the AppKit design system. Use these to ensure your custom UI matches the AppKit aesthetic.
