# @ton/appkit

A bridge between `@tonconnect/sdk` and `@ton/walletkit` that allows dApps to use TonConnect wallets with the familiar TonWalletKit interface.

## Overview

This package enables users to:
1. Receive a wallet from `@tonconnect/sdk` 
2. Pass it to a wrapper function
3. Achieve the same API as TonWalletKit wallets
4. Call methods like `wallet.createTransferTonTransaction()` 
5. Have TonWalletKit receive and show confirmations in the actual wallet

## Installation

```bash
npm install @ton/appkit @tonconnect/sdk @ton/walletkit
```

## Quick Start

### 1. Basic Setup

```typescript
import { Wallet } from '@tonconnect/sdk';
import { TonWalletKit } from '@ton/walletkit';
import { AppKit } from '@ton/appkit';

// Initialize TonWalletKit (your wallet app)
const walletKit = new TonWalletKit({
    bridgeUrl: 'https://bridge.tonapi.io/bridge',
    // Your wallet configuration...
});

// Initialize AppKit
const appKit = new AppKit({ walletKit });
```

### 2. Connect TonConnect Wallet

```typescript
// In your dApp, connect with TonConnect
const tonConnectWallet = new Wallet({
    manifestUrl: 'https://yourapp.com/tonconnect-manifest.json'
});

// Connect to a wallet
await tonConnectWallet.connect({
    universalLink: 'https://app.tonkeeper.com/ton-connect',
    bridgeUrl: 'https://bridge.tonapi.io/bridge'
});
```

### 3. Wrap and Use

```typescript
if (tonConnectWallet.connected) {
    // Wrap the TonConnect wallet to get TonWalletKit-compatible interface
    const wrappedWallet = appKit.wrapWallet(tonConnectWallet);
    
    // Now you can use the familiar TonWalletKit wallet interface!
    const transaction = await wrappedWallet.createTransferTonTransaction({
        toAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
        amount: '1000000000', // 1 TON in nanotons
        comment: 'Hello from AppKit!'
    });
    
    // This will trigger confirmation in the actual wallet app
    await walletKit.handleNewTransaction(wrappedWallet, transaction);
}
```

## API Reference

### AppKit

#### `new AppKit(config: AppKitConfig)`

Creates a new AppKit instance.

**Parameters:**
- `config.walletKit` - Your TonWalletKit instance
- `config.manifestUrl` - Optional manifest URL for TonConnect

#### `appKit.wrapWallet(wallet: Wallet): TonConnectWalletWrapper`

Wraps a connected TonConnect wallet to provide TonWalletKit-compatible interface.

**Parameters:**
- `wallet` - Connected TonConnect wallet instance

**Returns:** Wrapped wallet with TonWalletKit interface

### TonConnectWalletWrapper

The wrapped wallet implements the full `WalletInterface` from TonWalletKit:

```typescript
interface WalletInterface {
    // Basic wallet info
    publicKey: Uint8Array;
    version: string;
    getAddress(): string;
    getBalance(): Promise<bigint>;
    getNetwork(): CHAIN;
    
    // Transaction creation
    createTransferTonTransaction(params: TonTransferParams): Promise<ConnectTransactionParamContent>;
    createTransferMultiTonTransaction(params: TonTransferManyParams): Promise<ConnectTransactionParamContent>;
    
    // Additional methods for jettons, NFTs, etc.
    // (see TonWalletKit documentation)
}
```

## Supported Features

### ✅ Currently Supported
- Basic TON transfers (`createTransferTonTransaction`)
- Multi-message transfers (`createTransferMultiTonTransaction`) 
- Balance queries (`getBalance`)
- Address and network info
- Transaction previews
- Integration with TonWalletKit confirmation flows

### 🚧 Planned Features
- Jetton transfers (`createTransferJettonTransaction`)
- NFT transfers (`createTransferNftTransaction`)
- Data signing (`getSignedSignData`)
- TON Proof (`getSignedTonProof`)

## How It Works

1. **Bridge Pattern**: AppKit acts as a bridge between TonConnect's protocol and TonWalletKit's interface
2. **Transaction Translation**: Converts TonWalletKit transaction formats to TonConnect protocol
3. **Confirmation Flow**: Routes transactions through TonWalletKit to show confirmations in the actual wallet
4. **Type Safety**: Maintains full TypeScript compatibility with both libraries

## Examples

See `src/example.ts` for a complete working example.

### Simple Transfer

```typescript
const transaction = await wrappedWallet.createTransferTonTransaction({
    toAddress: 'EQC...',
    amount: '1000000000', // 1 TON
    comment: 'Payment for services'
});

await walletKit.handleNewTransaction(wrappedWallet, transaction);
```

### Multi-Transfer

```typescript
const transaction = await wrappedWallet.createTransferMultiTonTransaction({
    messages: [
        {
            toAddress: 'EQC...',
            amount: '500000000',
            comment: 'Payment 1'
        },
        {
            toAddress: 'EQD...',
            amount: '300000000', 
            comment: 'Payment 2'
        }
    ]
});

await walletKit.handleNewTransaction(wrappedWallet, transaction);
```

## Contributing

This package is part of the TonWalletKit monorepo. See the main README for contribution guidelines.

## License

ISC
