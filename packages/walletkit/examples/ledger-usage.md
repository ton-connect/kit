# Ledger Wallet Integration Example

This document shows how to use the WalletV4R2LedgerAdapter with the `@demo/v4ledger-adapter` package.

> **Note:** `@demo/v4ledger-adapter` isn’t published as a prebuilt package. It is provided for demonstration only — you’ll need to build it yourself before use.

## Installation

First, install the required packages:

```bash
npm install @ledgerhq/hw-transport-webusb
# or for other environments:
# npm install @ledgerhq/hw-transport-webhid
# npm install @ledgerhq/hw-transport-node-hid
```

## Basic Usage

```typescript
import { ApiClientToncenter, Network, wrapWalletInterface } from '@ton/walletkit';
import { createWalletV4R2Ledger, createWalletInitConfigLedger, createLedgerPath } from '@demo/v4ledger-adapter';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';

async function setupLedgerWallet() {
    // 1. Create API client
    const client = new ApiClientToncenter({
        endpoint: 'https://toncenter.com',
        apiKey: 'your-api-key', // Optional, get from https://t.me/toncenter
    });
    
    // 2. Create derivation path
    // createLedgerPath(testnet, workchain, accountIndex)
    const path = createLedgerPath(false, 0, 0); // mainnet, workchain 0, account 0
    
    // 3. Create Ledger wallet configuration
    const ledgerConfig = createWalletInitConfigLedger({
        createTransport: async () => await TransportWebUSB.create(),
        path,
        version: 'v4r2', // Only v4r2 is supported for Ledger
        network: Network.mainnet(),
        workchain: 0,
        accountIndex: 0,
    });
    
    // 4. Create Ledger wallet adapter
    const ledgerAdapter = await createWalletV4R2Ledger(ledgerConfig, { tonClient: client });
    
    // 5. Wrap adapter to get full Wallet interface
    const ledgerWallet = await wrapWalletInterface(ledgerAdapter);
    
    console.log('Ledger wallet address:', ledgerWallet.getAddress());
    console.log('Balance:', await ledgerWallet.getBalance());
}
```

## Adding Ledger Wallet to TonWalletKit

```typescript
import { TonWalletKit, Network } from '@ton/walletkit';
import { createWalletV4R2Ledger, createWalletInitConfigLedger, createLedgerPath } from '@demo/v4ledger-adapter';
import TransportWebUSB from '@ledgerhq/hw-transport-webusb';

async function addLedgerWallet(walletKit: TonWalletKit) {
    const path = createLedgerPath(false, 0, 0);
    
    const ledgerConfig = createWalletInitConfigLedger({
        createTransport: async () => await TransportWebUSB.create(),
        path,
        version: 'v4r2',
        network: Network.mainnet(),
        workchain: 0,
        accountIndex: 0,
    });
    
    // Get client from kit for the target network
    const client = walletKit.getApiClient(Network.mainnet());
    
    // Create Ledger adapter
    const ledgerAdapter = await createWalletV4R2Ledger(ledgerConfig, { tonClient: client });
    
    // Add wallet to kit
    const wallet = await walletKit.addWallet(ledgerAdapter);
    return wallet;
}
```

## Signing Transactions

The Ledger wallet automatically handles signing with the hardware device:

```typescript
// Create a transaction message
const message: TransactionRequestMessage = {
    address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    amount: '100000000', // 0.1 TON in nanotons
};

// Sign and send (this will prompt on Ledger device)
const signedBoc = await ledgerWallet.getSignedSendTransaction(
    {
        network: Network.mainnet(),
        validUntil: Math.floor(Date.now() / 1000) + 60,
        messages: [message],
    },
    { fakeSignature: false }
);
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
    const adapter = await createWalletV4R2Ledger(ledgerConfig, { tonClient: client });
    const wallet = await wrapWalletInterface(adapter);
    
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
