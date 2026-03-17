<!--
This file is auto-generated. Do not edit manually.
Changes will be overwritten when running the docs update script.
Source template: template/packages/walletkit/src/defi/swap/dedust/README.md
-->

# DeDust Swap Provider

DeDust Router v2 is a DEX aggregator that finds the best swap rates across multiple pools and protocols on TON blockchain.

For detailed information about DeDust Router, see the [official documentation](https://hub.dedust.io/apis/router-v2/overview/).

## Quick Start

```ts
const provider = new DeDustSwapProvider({
    defaultSlippageBps: 100, // 1%
    referralAddress: 'EQ...',
    referralFeeBps: 50, // 0.5%
});
kit.registerProvider(provider);
```

## Configuration

```typescript
interface DeDustSwapProviderConfig {
    providerId?: string;          // Default: 'dedust'
    apiUrl?: string;              // Default: 'https://api-mainnet.dedust.io'
    defaultSlippageBps?: number;  // Default: 100 (1%)
    referralAddress?: string;     // Optional referral address
    referralFeeBps?: number;     // Referral fee in bps (max 100 = 1%)
    onlyVerifiedPools?: boolean; // Default: true
    maxSplits?: number;          // Default: 4
    maxLength?: number;          // Default: 3 (max route hops)
    minPoolUsdTvl?: string;      // Default: '5000'
}
```

**Note:** DeDust Router only supports mainnet. See [Swap README](../README.md) for base parameters.

## Protocol Routing

```ts
const TON = { address: 'ton', decimals: 9 };
const USDT = {
    address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
    decimals: 6,
};

const quote = await getSwapQuote(appKit, {
    from: TON,
    to: USDT,
    amount: '1000000000',
    network: Network.mainnet(),
    providerOptions: {
        protocols: ['dedust', 'dedust_v3', 'stonfi_v1', 'stonfi_v2', 'tonco'],
        excludeProtocols: ['memeslab'],
        onlyVerifiedPools: true,
        maxSplits: 4,
        maxLength: 3,
        excludeVolatilePools: true,
    } as DeDustProviderOptions,
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
    amount: '1000000000',
    network: Network.mainnet(),
    providerOptions: {
        referralAddress: 'EQ...',
        referralFeeBps: 50, // 0.5%
    } as DeDustProviderOptions,
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
const provider = new DeDustSwapProvider({
    referralAddress: 'EQ...global',
    referralFeeBps: 50,
});
appKit.registerProvider(provider);

// Override for specific quote
const quote = await getSwapQuote(appKit, {
    from: TON,
    to: USDT,
    amount: '1000000000',
    network: Network.mainnet(),
    providerOptions: {
        referralAddress: 'EQ...different', // Uses this instead of global
        referralFeeBps: 75,
    } as DeDustProviderOptions,
});

// Or use global settings by omitting providerOptions
const quote2 = await getSwapQuote(appKit, {
    from: TON,
    to: USDT,
    amount: '1000000000',
    network: Network.mainnet(),
    // Uses global referrer from config
});
```

## Resources

- [DeDust Router v2 Documentation](https://hub.dedust.io/apis/router-v2/overview/) - API overview
- [Quote API](https://hub.dedust.io/apis/router-v2/quote/) - Get swap quotes
- [Swap API](https://hub.dedust.io/apis/router-v2/swap/) - Build swap transactions
- [Demo Implementation](https://github.com/ton-connect/kit/blob/main/apps/demo-wallet/src/pages/Swap.tsx) - Working example
