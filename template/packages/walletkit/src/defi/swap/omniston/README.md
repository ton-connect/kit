---
target: packages/walletkit/src/defi/swap/omniston/README.md
---

# Omniston Swap Provider

Omniston is STON.fi's swap aggregator that finds the best rates across multiple DEXs on TON blockchain.

For detailed information about Omniston features and capabilities, see the [official documentation](https://docs.ston.fi/developer-section/omniston).

## Quick Start

%%demo/examples/src/appkit/swap#OMNISTON_QUICK_START%%

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

%%demo/examples/src/appkit/swap#OMNISTON_USAGE_EXAMPLE%%

## Referral Fees

%%demo/examples/src/appkit/swap#OMNISTON_REFERRAL_FEES%%

### Overriding Referral Settings

%%demo/examples/src/appkit/swap#OMNISTON_OVERRIDING_REFERRAL%%

## Resources

- [Omniston Documentation](https://docs.ston.fi/developer-section/omniston) - Complete guide and API reference
- [Referral Fees](https://docs.ston.fi/developer-section/omniston/referral-fees) - How to earn fees
- [SDK Repository](https://github.com/ston-fi/omniston-sdk) - Source code and examples
- [Demo Implementation](https://github.com/ton-connect/kit/blob/main/apps/demo-wallet/src/pages/Swap.tsx) - Working example
