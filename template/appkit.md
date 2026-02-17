---
target: packages/appkit/README.md
---

# TonAppKit

A dApp-side integration layer for TON Connect with a unified asset API for TON, Jettons, and NFTs

## Overview

- [Actions](https://github.com/ton-connect/kit/tree/main/packages/appkit/docs/actions.md) - Standardized blockchain actions
- [Connectors](https://github.com/ton-connect/kit/tree/main/packages/appkit/docs/connectors.md) - Wallet connection management (TonConnect)
- [Queries](https://github.com/ton-connect/kit/tree/main/packages/appkit/docs/query.md) - TanStack Query options for easy data fetching
- [Swap](https://github.com/ton-connect/kit/tree/main/packages/appkit/docs/swap.md) - Swap assets using DEX aggregators (Omniston)

**Live Demo**: [AppKit Minter](https://github.com/ton-connect/kit/tree/main/apps/appkit-minter)

## Quick start

This guide shows how to integrate `@ton/appkit` into your dApp for asset operations with TonConnect wallets.

```bash
npm install @ton/appkit @ton/core @ton/crypto
```

## Peer Dependencies

`@ton/appkit` depends on the following packages:

- `@ton/core` (>= 0.56.0)
- `@ton/crypto` (>= 3.3.0)
- `@tanstack/query-core` (>= 5.0.0) - **Optional**, required only if using usages via `QueryClient`
- `@tonconnect/ui` (>= 2.4.1) - **Optional**, required only if using `TonConnectConnector` with UI
- `@ston-fi/omniston-sdk` - **Optional**, required only if using Swap functionality

## Initialize AppKit and wrap wallet

%%demo/examples/src/appkit#APPKIT_INIT%%

## Usage
 
### Get Balance
 
%%demo/examples/src/appkit/actions/balances#GET_BALANCE%%
 
### Transfer TON
 
%%demo/examples/src/appkit/actions/transaction#TRANSFER_TON%%
 
> See all available actions in the [Actions Documentation](https://github.com/ton-connect/kit/tree/main/packages/appkit/docs/actions.md).

## React Integration

If you are using React, you can use `@ton/appkit-react` which provides hooks for all AppKit actions.

[Read more about AppKit React](https://github.com/ton-connect/kit/tree/main/packages/appkit-react/README.md)
 
If you are using another framework (Vue, Svelte, Angular, Solid, etc.), you can use `@ton/appkit/queries` with [TanStack Query](https://tanstack.com/query/latest) to create your own bindings.
 
[Read more about Queries](https://github.com/ton-connect/kit/tree/main/packages/appkit/docs/query.md)
