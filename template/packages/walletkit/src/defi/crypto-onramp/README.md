---
target: packages/walletkit/src/defi/crypto-onramp/README.md
---

# Crypto Onramp Manager

CryptoOnrampManager provides a unified interface for bridging crypto assets from external chains into TON assets via third-party bridge providers.

## Quick Start

```typescript
import { TonWalletKit, Network } from '@ton/walletkit';
import { createSwapsXyzProvider } from '@ton/walletkit/crypto-onramp/swaps-xyz';

const kit = new TonWalletKit({
    networks: {
        [Network.mainnet().chainId]: {
            apiClient: { url: 'https://toncenter.com', key: 'optional-api-key' },
        },
    },
});

kit.cryptoOnramp.registerProvider(
    createSwapsXyzProvider({ apiKey: 'your-api-key' }),
);
kit.cryptoOnramp.setDefaultProvider('swaps-xyz');
```

## Quote Parameters

All providers accept the same base parameters for `getQuote`:

```typescript
interface CryptoOnrampQuoteParams<TProviderOptions = unknown> {
    amount: string;                     // Amount in base units (source or target, see isSourceAmount)
    sourceCurrencyAddress: string;      // Source token contract address (or native zero address)
    sourceNetwork: string;              // Source chain identifier
    targetCurrencyAddress: string;      // Target TON token address
    recipientAddress: string;           // TON address that will receive the target crypto
    refundAddress?: string;             // Refund address on the source chain (required by some providers)
    isSourceAmount?: boolean;           // true = spend `amount` source tokens, false = receive `amount` target tokens (default: true)
    providerOptions?: TProviderOptions; // Provider-specific options (slippage, etc.)
}
```

## Getting a Quote

```typescript
const quote = await kit.cryptoOnramp.getQuote({
    sourceCurrencyAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT on Arbitrum
    sourceNetwork: '42161', // Arbitrum One chain ID
    targetCurrencyAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', // USDT on TON
    amount: '1000000', // 1 USDT (6 decimals)
    recipientAddress: 'UQ...', // TON address to receive the bridged tokens
});

console.log('Source amount:', quote.sourceAmount);
console.log('Target amount:', quote.targetAmount);
console.log('Rate:', quote.rate);
console.log('Recipient:', quote.recipientAddress);
```

## Creating a Deposit

```typescript
const deposit = await kit.cryptoOnramp.createDeposit({
    quote,
    refundAddress: '0x...', // EVM address to refund on failure (required by some providers)
});

console.log('Send to:', deposit.address);
console.log('Amount:', deposit.amount);
console.log('Deposit ID:', deposit.depositId);
```

## Checking Deposit Status

```typescript
const status = await kit.cryptoOnramp.getStatus({
    depositId: deposit.depositId,
});
// status: 'pending' | 'success' | 'failed'
```

## Creating a Custom Provider

Extend `CryptoOnrampProvider` to integrate a new bridge:

```typescript
import {
    CryptoOnrampProvider,
    type CryptoOnrampQuoteParams,
    type CryptoOnrampQuote,
    type CryptoOnrampDepositParams,
    type CryptoOnrampDeposit,
    type CryptoOnrampStatusParams,
    type CryptoOnrampStatus,
    type Network,
} from '@ton/walletkit';

interface MyQuoteOptions {
    slippageBps?: number;
}

export class MyCryptoOnrampProvider extends CryptoOnrampProvider<MyQuoteOptions> {
    readonly providerId = 'my-provider';

    getSupportedNetworks(): Network[] {
        return [Network.mainnet()];
    }

    getMetadata() {
        return { name: 'My Provider', url: 'https://my-provider.com', requiresRefundAddress: true };
    }

    async getQuote(params: CryptoOnrampQuoteParams<MyQuoteOptions>): Promise<CryptoOnrampQuote> {
        const { recipientAddress, sourceCurrencyAddress, targetCurrencyAddress } = params;
        // Fetch quote from your bridge API...
        return {
            sourceCurrencyAddress,
            sourceNetwork: params.sourceNetwork,
            targetCurrencyAddress,
            sourceAmount: '...',
            targetAmount: '...',
            rate: '...',
            recipientAddress,
            providerId: this.providerId,
        };
    }

    async createDeposit(params: CryptoOnrampDepositParams): Promise<CryptoOnrampDeposit> {
        // params.quote.recipientAddress holds the TON recipient set at quote time
        return { depositId: '...', address: '0x...', amount: '...', sourceCurrencyAddress: '...', sourceNetwork: '...', providerId: this.providerId };
    }

    async getStatus(params: CryptoOnrampStatusParams): Promise<CryptoOnrampStatus> {
        return 'pending';
    }
}
```

## Available Providers

- **[Swaps.xyz](https://github.com/ton-connect/kit/blob/main/packages/walletkit/src/defi/crypto-onramp/swaps-xyz/README.md)**: Multi-chain bridge to TON via swaps.xyz, supporting a wide range of source networks and tokens
- **[Layerswap](https://github.com/ton-connect/kit/blob/main/packages/walletkit/src/defi/crypto-onramp/layerswap/README.md)**: Multi-chain bridge to TON via Layerswap

## API Reference

### CryptoOnrampManager

#### `getQuote(params, providerId?)`
Get a quote for a crypto-to-TON bridge operation.

**Parameters:**
- `params: CryptoOnrampQuoteParams<TProviderOptions>` – `sourceCurrencyAddress`, `sourceNetwork`, `targetCurrencyAddress`, `amount`, `recipientAddress`, `isSourceAmount?`, `refundAddress?`, `providerOptions?`
- `providerId?: string` – Provider to use (uses default if omitted)

**Returns:** `Promise<CryptoOnrampQuote>`

#### `createDeposit(params, providerId?)`
Create a deposit from a previously obtained quote. Returns the address the user must fund on the source chain.

**Parameters:**
- `params: CryptoOnrampDepositParams` – `quote`, `refundAddress`
- `providerId?: string` – Resolved from `quote.providerId` when omitted

**Returns:** `Promise<CryptoOnrampDeposit>`

#### `getStatus(params, providerId?)`
Poll the status of a deposit.

**Parameters:**
- `params: CryptoOnrampStatusParams` – `depositId`
- `providerId?: string` – Provider to use (uses default if omitted)

**Returns:** `Promise<CryptoOnrampStatus>` — `'pending' | 'success' | 'failed'`

#### `registerProvider(provider)`
Register a new crypto onramp provider (instance or factory).

#### `setDefaultProvider(providerId)`
Set the default provider for operations that do not specify one.
