# Omniston Swap Provider

Omniston is STON.fi's swap aggregator that finds the best rates across multiple DEXs on TON blockchain.

For detailed information about Omniston features and capabilities, see the [official documentation](https://docs.ston.fi/developer-section/omniston).

## Quick Start

```typescript
import { OmnistonSwapProvider } from '@ton/walletkit/swap/omniston';

const provider = new OmnistonSwapProvider({
    defaultSlippageBps: 100, // 1%
    quoteTimeoutMs: 10000,
});

kit.swap.registerProvider(provider);
```

## Configuration Options

```typescript
interface OmnistonSwapProviderConfig {
    apiUrl?: string;              // Default: 'wss://omni-ws.ston.fi'
    defaultSlippageBps?: number;  // Default: 100 (1%)
    quoteTimeoutMs?: number;      // Default: 10000ms
    referrerAddress?: string;     // Optional referrer address
    referrerFeeBps?: number;      // Referrer fee in bps
    flexibleReferrerFee?: boolean; // Default: false
}

interface SwapQuoteParams {
    fromToken: string;
    toToken: string;
    amount: string;
    network: Network;
    slippageBps?: number;
    maxOutgoingMessages?: number; // Max messages per tx (default: 1 if not specified)
    providerOptions?: OmnistonProviderOptions;
}
```

**Important:** The `maxOutgoingMessages` parameter should be extracted from the wallet's features using `getMaxOutgoingMessages()` utility. If not provided, it defaults to `1`, which may limit swap route optimization.

### Usage Example

```typescript
import { getMaxOutgoingMessages } from '@ton/walletkit';

// Extract maxOutgoingMessages from wallet features
const features = wallet.getSupportedFeatures();
const maxOutgoingMessages = getMaxOutgoingMessages(features);

const quote = await kit.swap.getQuote({
    fromToken: 'TON',
    toToken: 'USDT',
    amount: '1000000000',
    network: Network.mainnet(),
    maxOutgoingMessages, // Pass wallet's capability
});
```

## Referral Fees

Pass referral options via `providerOptions` to earn fees on swaps:

```typescript
import type { OmnistonProviderOptions } from '@ton/walletkit/swap/omniston';

const quote = await kit.swap.getQuote({
    fromToken: 'TON',
    toToken: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
    amount: '1000000000',
    network: Network.mainnet(),
    providerOptions: {
        referrerAddress: 'EQ...',
        referrerFeeBps: 10, // 0.1%
    } as OmnistonProviderOptions,
});
```

### Overriding Referral Settings

You can set a global referrer in provider config and override it for specific requests:

```typescript
// Global referrer in config
const provider = new OmnistonSwapProvider({
    referrerAddress: 'EQ...global',
    referrerFeeBps: 10,
});

// Override for specific quote
const quote = await kit.swap.getQuote({
    fromToken: 'TON',
    toToken: 'USDT',
    amount: '1000000000',
    network: Network.mainnet(),
    providerOptions: {
        referrerAddress: 'EQ...different', // Uses this instead of global
        referrerFeeBps: 20,
    } as OmnistonProviderOptions,
});

// Or use global settings by omitting providerOptions
const quote2 = await kit.swap.getQuote({
    fromToken: 'TON',
    toToken: 'USDT',
    amount: '1000000000',
    network: Network.mainnet(),
    // Uses global referrer from config
});
```

## Resources

- [Omniston Documentation](https://docs.ston.fi/developer-section/omniston) - Complete guide and API reference
- [Referral Fees](https://docs.ston.fi/developer-section/omniston/referral-fees) - How to earn fees
- [SDK Repository](https://github.com/ston-fi/omniston-sdk) - Source code and examples
- [Demo Implementation](../../../../apps/demo-wallet/src/pages/Swap.tsx) - Working example
