---
target: packages/walletkit/src/defi/swap/README.md
---

# Swap Manager

SwapManager provides a unified interface for token swaps across multiple DEX protocols on TON blockchain.

## Quick Start

```typescript
import { WalletKit } from '@ton/walletkit';
import { OmnistonSwapProvider } from '@ton/walletkit/swap/omniston';

const kit = new WalletKit({
    network: Network.mainnet(),
});

// Register Omniston provider
const omnistonProvider = new OmnistonSwapProvider({
    defaultSlippageBps: 100, // 1%
    quoteTimeoutMs: 10000,
});

kit.swap.registerProvider(omnistonProvider);
kit.swap.setDefaultProvider('omniston');
```

## Quote Parameters

All providers use the same base parameters for `getQuote`:

```typescript
interface SwapQuoteParams<TProviderOptions = unknown> {
    from: SwapToken;
    to: SwapToken;
    amount: string;
    network: Network;
    slippageBps?: number;
    providerOptions?: TProviderOptions;
}
```

Providers may add provider-specific parameters (e.g. `maxOutgoingMessages`, `isReverseSwap`). See each provider's README for details.

## Referral Fees

Many providers support referral fees. You can configure a global referrer in the provider config or pass options per request via `providerOptions`. Option names vary by provider (e.g. `referrerAddress` vs `referralAddress`).

- [Omniston](https://github.com/ton-connect/kit/blob/main/packages/walletkit/src/defi/swap/omniston/README.md#referral-fees) – `referrerAddress`, `referrerFeeBps`
- [DeDust](https://github.com/ton-connect/kit/blob/main/packages/walletkit/src/defi/swap/dedust/README.md#referral-fees) – `referralAddress`, `referralFeeBps`

## Overriding Referral Settings

You can set a global referrer in provider config and override it for specific requests by passing different options in `providerOptions`. See provider docs for examples:

- [Omniston](https://github.com/ton-connect/kit/blob/main/packages/walletkit/src/defi/swap/omniston/README.md#overriding-referral-settings)
- [DeDust](https://github.com/ton-connect/kit/blob/main/packages/walletkit/src/defi/swap/dedust/README.md#overriding-referral-settings)

## Getting a Quote

```typescript
import type { OmnistonProviderOptions } from '@ton/walletkit/swap/omniston';

const quote = await kit.swap.getQuote({
    from: { address: 'ton', decimals: 9 },
    to: { address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', decimals: 6 },
    amount: '1000000000',
    network: Network.mainnet(),
    slippageBps: 100,
    providerOptions: {
        referrerAddress: 'EQ...',
        referrerFeeBps: 10,
    } as OmnistonProviderOptions,
});

console.log('You will receive:', quote.toAmount);
console.log('Minimum received:', quote.minReceived);
```

## Executing a Swap

```typescript
const transaction = await kit.swap.buildSwapTransaction({
    quote,
    userAddress: 'EQ...',
    destinationAddress: 'EQ...',
});

await kit.handleNewTransaction(wallet, transaction);
```

## Creating a Custom Swap Provider

To create your own swap provider, extend the `SwapProvider` base class:

```typescript
import { SwapProvider } from '@ton/walletkit/swap';
import type { SwapQuoteParams, SwapQuote, SwapParams } from '@ton/walletkit/swap';
import type { TransactionRequest } from '@ton/walletkit';

interface MyProviderOptions {
    customParam?: string;
}

export class MySwapProvider extends SwapProvider<MyProviderOptions> {
    readonly providerId = 'my-provider';

    async getQuote(params: SwapQuoteParams<MyProviderOptions>): Promise<SwapQuote> {
        const { from, to, amount, network, providerOptions } = params;
        // Implement quote logic...
        return { fromToken: from, toToken: to, fromAmount: amount, toAmount: '0', network, /* ... */ };
    }

    async buildSwapTransaction(params: SwapParams<MyProviderOptions>): Promise<TransactionRequest> {
        // Build transaction...
        return { fromAddress: params.userAddress, messages: [], network: params.quote.network };
    }
}
```

## Available Providers

- **[Omniston](https://github.com/ton-connect/kit/blob/main/packages/walletkit/src/defi/swap/omniston/README.md)**: STON.fi aggregator supporting multiple DEXs
- **[DeDust](https://github.com/ton-connect/kit/blob/main/packages/walletkit/src/defi/swap/dedust/README.md)**: DeDust Router v2 aggregator supporting multiple pools and protocols

## API Reference

### SwapManager

#### `getQuote(params, providerId?)`
Get a quote for token swap.

**Parameters:**
- `params: SwapQuoteParams<TProviderOptions>` – `from`, `to`, `amount`, `network`, `slippageBps?`, `providerOptions?`
- `providerId?: string` – Provider name (uses default if not specified)

**Returns:** `Promise<SwapQuote>`

#### `buildSwapTransaction(params, providerId?)`
Build transaction for executing swap.

**Parameters:**
- `params: SwapParams<TProviderOptions>` – `quote`, `userAddress`, `destinationAddress?`, `providerOptions?`
- `providerId?: string` – Provider name

**Returns:** `Promise<TransactionRequest>`

#### `registerProvider(provider)`
Register a new swap provider.

#### `setDefaultProvider(providerId)`
Set default provider for swap operations.

## Examples

See the [demo wallet](https://github.com/ton-connect/kit/blob/main/apps/demo-wallet/src/pages/Swap.tsx) for a complete implementation.
