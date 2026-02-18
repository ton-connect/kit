---
target: packages/appkit-react/docs/components.md
---

# Components

`@ton/appkit-react` provides a set of themed, ready-to-use UI components for building TON dApps.

## Providers
 
 ### `AppKitProvider`
 
 The root provider for AppKit. It must wrap your application.
 
 %%demo/examples/src/appkit/components/providers#APP_KIT_PROVIDER%%
 
 ## Balances

### `SendTonButton`

A specialized button for sending TON. Pre-configured for TON transfers.

%%demo/examples/src/appkit/components/balances#SEND_TON_BUTTON%%

### `SendJettonButton`

A specialized button for sending Jettons. Handles jetton-specific logic.

%%demo/examples/src/appkit/components/balances#SEND_JETTON_BUTTON%%

## Transactions

### `Transaction`

A drop-in component that handles the entire transaction flow.

%%demo/examples/src/appkit/components/transaction#TRANSACTION%%

## Wallets

### `TonConnectButton`

A button that triggers the wallet connection flow.

%%demo/examples/src/appkit/components/wallets#CONNECT_BUTTON%%
