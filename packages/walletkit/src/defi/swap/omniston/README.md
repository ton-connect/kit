<!--
This file is auto-generated. Do not edit manually.
Changes will be overwritten when running the docs update script.
Source template: template/packages/walletkit/src/defi/swap/omniston/README.md
-->

# Omniston Swap Provider

Omniston is STON.fi's swap aggregator that finds the best rates across multiple DEXs on TON blockchain.

For detailed information about Omniston features and capabilities, see the [official documentation](https://docs.ston.fi/developer-section/omniston).

## Quick Start

```ts
const provider = new OmnistonSwapProvider({
    defaultSlippageBps: 100, // 1%
    quoteTimeoutMs: 10000,
});
kit.registerProvider(provider);
```

## Configuration

```typescript
interface OmnistonSwapProviderConfig {
    apiUrl?: string;              // Default: 'wss://omni-ws.ston.fi'
    defaultSlippageBps?: number;  // Default: 100 (1%)
    quoteTimeoutMs?: number;      // Default: 10000ms
    referrerAddress?: string;     // Optional referrer address
    referrerFeeBps?: number;      // Referrer fee in bps
    flexibleReferrerFee?: boolean; // Default: false
}
```

**Omniston-specific quote options:** `maxOutgoingMessages` (max messages per tx; default 1). Extract from wallet features via `getMaxOutgoingMessages()`. See [Swap README](../README.md) for base parameters.

### Usage Example

```ts
const TON = { address: 'ton', decimals: 9 };
const USDT = {
    address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
    decimals: 6,
};

const quote = await getSwapQuote(appKit, {
    from: TON,
    to: USDT,
    amount: '0.1',
    network: Network.mainnet(),
    maxOutgoingMessages: 1,
});
```

## Referral Fees

```ts
const TON = { address: 'ton', decimals: 9 };
const USDT = {
    address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
    decimals: 6,
};

const quote = await getSwapQuote(appKit, {
    from: TON,
    to: USDT,
    amount: '0.1',
    network: Network.mainnet(),
    providerOptions: {
        referrerAddress: 'EQ...',
        referrerFeeBps: 10, // 0.1%
    } as OmnistonProviderOptions,
});
```

### Overriding Referral Settings

```ts
const TON = { address: 'ton', decimals: 9 };
const USDT = {
    address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
    decimals: 6,
};

// Global referrer in config
const provider = new OmnistonSwapProvider({
    referrerAddress: 'EQ...global',
    referrerFeeBps: 10,
});
appKit.registerProvider(provider);

// Override for specific quote
const quote = await getSwapQuote(appKit, {
    from: TON,
    to: USDT,
    amount: '1000000000',
    network: Network.mainnet(),
    providerOptions: {
        referrerAddress: 'EQ...different', // Uses this instead of global
        referrerFeeBps: 20,
    } as OmnistonProviderOptions,
});

// Or use global settings by omitting providerOptions
const quote2 = await getSwapQuote(appKit, {
    from: TON,
    to: USDT,
    amount: '0.1',
    network: Network.mainnet(),
    // Uses global referrer from config
});
```

## Resources

- [Omniston Documentation](https://docs.ston.fi/developer-section/omniston) - Complete guide and API reference
- [Referral Fees](https://docs.ston.fi/developer-section/omniston/referral-fees) - How to earn fees
- [SDK Repository](https://github.com/ston-fi/omniston-sdk) - Source code and examples
- [Demo Implementation](https://github.com/ton-connect/kit/blob/main/apps/demo-wallet/src/pages/Swap.tsx) - Working example
