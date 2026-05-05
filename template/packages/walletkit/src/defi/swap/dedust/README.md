---
target: packages/walletkit/src/defi/swap/dedust/README.md
---

# DeDust Swap Provider

DeDust Router v2 is a DEX aggregator that finds the best swap rates across multiple pools and protocols on TON blockchain.

For detailed information about DeDust Router, see the [official documentation](https://hub.dedust.io/apis/router-v2/overview/).

## Quick Start

%%demo/examples/src/appkit/swap#DEDUST_QUICK_START%%

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

%%demo/examples/src/appkit/swap#DEDUST_PROTOCOL_ROUTING%%

## Referral Fees

%%demo/examples/src/appkit/swap#DEDUST_REFERRAL_FEES%%

### Overriding Referral Settings

%%demo/examples/src/appkit/swap#DEDUST_OVERRIDING_REFERRAL%%

## Resources

- [DeDust Router v2 Documentation](https://hub.dedust.io/apis/router-v2/overview/) - API overview
- [Quote API](https://hub.dedust.io/apis/router-v2/quote/) - Get swap quotes
- [Swap API](https://hub.dedust.io/apis/router-v2/swap/) - Build swap transactions
- [Demo Implementation](https://github.com/ton-connect/kit/blob/main/apps/demo-wallet/src/pages/Swap.tsx) - Working example
