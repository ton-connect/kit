# Ledger Wallet Integration Example

This document shows how to use the WalletV4R2LedgerAdapter with the @ton-community/ton-ledger package.

## Installation

First, install the required packages:

```bash
npm install @ton-community/ton-ledger @ledgerhq/hw-transport-webusb
# or for other environments:
# npm install @ledgerhq/hw-transport-webhid
# npm install @ledgerhq/hw-transport-node-hid
```

## Basic Usage

```typescript
import { TonWalletKit, createWalletInitConfigLedger, createLedgerPath } from '@ton/walletkit';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';

async function setupLedgerWallet() {
    // 1. Connect to Ledger device
    const transport = await TransportWebUSB.create();
    
    // 2. Create derivation path
    // pathForAccount(testnet, workchain, accountIndex)
    const path = createLedgerPath(false, 0, 0); // mainnet, workchain 0, account 0
    
    // 3. Create Ledger wallet configuration
    const ledgerConfig = createWalletInitConfigLedger({
        transport,
        path,
        version: 'v4r2', // Only v4r2 is supported for Ledger
        network: 'mainnet',
        workchain: 0,
        accountIndex: 0
    });
    
    // 4. Initialize TonWalletKit with Ledger wallet
    const walletKit = await TonWalletKit.create({
        wallets: [ledgerConfig]
    });
    
    // 5. Get the wallet instance
    const wallets = walletKit.getWallets();
    const ledgerWallet = wallets[0];
    
    console.log('Ledger wallet address:', ledgerWallet.getAddress());
    console.log('Balance:', await ledgerWallet.getBalance());
}
```

## Adding Ledger Wallet to Existing TonWalletKit

```typescript
import { createWalletInitConfigLedger, createLedgerPath } from '@ton/walletkit';

async function addLedgerWallet(walletKit: TonWalletKit) {
    const transport = await TransportWebUSB.create();
    const path = createLedgerPath(false, 0, 0);
    
    const ledgerConfig = createWalletInitConfigLedger({
        transport,
        path,
        version: 'v4r2'
    });
    
    const wallet = await walletKit.addWallet(ledgerConfig);
    return wallet;
}
```

## Signing Transactions

The Ledger wallet automatically handles signing with the hardware device:

```typescript
// Create a transaction
const transaction = await ledgerWallet.createTransferTonTransaction({
    toAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    amount: '100000000' // 0.1 TON in nanotons
});

// Sign and send (this will prompt on Ledger device)
const signedBoc = await ledgerWallet.getSignedSendTransaction(transaction, {
    fakeSignature: false
});
```

## Derivation Path Helper

The `createLedgerPath` function helps create proper BIP-44 derivation paths:

```typescript
// For mainnet, workchain 0, account 0
const mainnetPath = createLedgerPath(false, 0, 0);
// Returns: [44, 607, 0, 0, 0, 0]

// For testnet, workchain 0, account 1
const testnetPath = createLedgerPath(true, 0, 1);
// Returns: [44, 607, 1, 0, 1, 0]

// For mainnet, workchain -1 (masterchain), account 0
const masterchainPath = createLedgerPath(false, -1, 0);
// Returns: [44, 607, 0, 255, 0, 0]
```

## Error Handling

Always handle Ledger-specific errors:

```typescript
try {
    const wallet = await walletKit.addWallet(ledgerConfig);
    const signedTx = await wallet.getSignedSendTransaction(transaction, {
        fakeSignature: false
    });
} catch (error) {
    if (error.message.includes('Ledger')) {
        console.error('Ledger error:', error.message);
        // Handle Ledger-specific errors (device not connected, user rejected, etc.)
    } else {
        console.error('General error:', error);
    }
}
```

## Notes

- Only WalletV4R2 contracts are supported with Ledger
- Make sure your Ledger device has the TON app installed and is unlocked
- The user will need to approve transactions on the Ledger device
- Different transport libraries are needed for different environments (browser, Node.js, React Native)
