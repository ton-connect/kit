---
target: packages/appkit-react/docs/components.md
---

# Components

`@ton/appkit-react` provides a set of themed, ready-to-use UI components for building TON dApps.

## Providers
 
 ### `AppKitProvider`
 
 The root provider for AppKit. It must wrap your application.
 
 %%docs/examples/src/appkit/components/providers#APP_KIT_PROVIDER%%
 
 ## Balances

### `SendTonButton`

A specialized button for sending TON. Pre-configured for TON transfers.

%%docs/examples/src/appkit/components/balances#SEND_TON_BUTTON%%

### `SendJettonButton`

A specialized button for sending Jettons. Handles jetton-specific logic.

%%docs/examples/src/appkit/components/balances#SEND_JETTON_BUTTON%%

## Transactions

### `Send`

A drop-in component that handles the entire transaction flow.

%%docs/examples/src/appkit/components/transaction#TRANSACTION%%

## Wallets

### `TonConnectButton`

A button that triggers the wallet connection flow.

%%docs/examples/src/appkit/components/wallets#CONNECT_BUTTON%%

## Staking

### `StakingWidget`

A high-level component that provides a complete staking interface. It handles quote fetching, transaction building, and user interactions.

%%docs/examples/src/appkit/staking#STAKING_WIDGET_DEFAULT%%

#### Custom UI

You can also use a render function to build a completely custom UI while keeping the staking logic.

%%docs/examples/src/appkit/staking#STAKING_WIDGET_CUSTOM%%

## Swap

### `SwapWidget`

A high-level component that provides a complete swap interface. It handles token selection, quote fetching, and transaction building.

%%docs/examples/src/appkit/swap#SWAP_WIDGET_DEFAULT%%

#### Custom UI

You can also use a render function to build a completely custom UI while keeping the swap logic.

%%docs/examples/src/appkit/swap#SWAP_WIDGET_CUSTOM%%
