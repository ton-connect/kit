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

### `Send`

A drop-in component that handles the entire transaction flow.

%%demo/examples/src/appkit/components/transaction#TRANSACTION%%

## Wallets

### `TonConnectButton`

A button that triggers the wallet connection flow.

%%demo/examples/src/appkit/components/wallets#CONNECT_BUTTON%%

## Staking

### `StakingWidget`

A high-level component that provides a complete staking interface. It handles quote fetching, transaction building, and user interactions.

```tsx
import { StakingWidget } from '@ton/appkit-react';
import { Network } from '@ton/appkit';

// Default UI
return <StakingWidget network={Network.mainnet()} />;
```

#### Custom UI

You can also use a render function to build a completely custom UI while keeping the staking logic.

%%demo/examples/src/appkit/staking#STAKING_WIDGET_CUSTOM%%
