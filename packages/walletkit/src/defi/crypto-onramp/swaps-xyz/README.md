<!--
This file is auto-generated. Do not edit manually.
Changes will be overwritten when running the docs update script.
Source template: docs/templates/packages/walletkit/src/defi/crypto-onramp/swaps-xyz/README.md
-->

# Swaps.xyz Crypto Onramp Provider

Swaps.xyz is a multi-chain bridge aggregator that routes crypto from a wide range of source networks and tokens into TON assets.

For more information about supported chains and tokens, see the [official documentation](https://docs.swaps.xyz).

## Quick Start

```typescript
import { createSwapsXyzProvider } from '@ton/walletkit/crypto-onramp/swaps-xyz';

kit.cryptoOnramp.registerProvider(
    createSwapsXyzProvider({ apiKey: 'your-api-key' }),
);
kit.cryptoOnramp.setDefaultProvider('swaps-xyz');
```

## Configuration

```typescript
interface SwapsXyzProviderConfig {
    apiKey: string;          // API key issued by swaps.xyz
    apiUrl?: string;         // Default: 'https://api-v2.swaps.xyz/api'
    defaultSender?: string;  // Default EVM sender address used at quote time
}
```

## Quote Options

```typescript
interface SwapsXyzQuoteOptions {
    slippageBps?: number;    // Slippage tolerance in basis points (default: 100 = 1%)
}
```

See [Crypto Onramp README](../README.md) for base `CryptoOnrampQuoteParams`.

## Usage Example

```typescript
import type { SwapsXyzQuoteOptions } from '@ton/walletkit/crypto-onramp/swaps-xyz';

const quote = await kit.cryptoOnramp.getQuote<SwapsXyzQuoteOptions>({
    sourceCurrencyAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT on Arbitrum
    sourceNetwork: '42161',
    targetCurrencyAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', // USDT on TON
    amount: '1000000', // 1 USDT (6 decimals)
    recipientAddress: 'UQ...', // TON address to receive tokens
    providerOptions: {
        slippageBps: 50, // 0.5%
    },
});

const deposit = await kit.cryptoOnramp.createDeposit({
    quote,
    refundAddress: '0x...', // EVM address to refund if the bridge fails
});

// deposit.address — contract to approve + call on the source chain
// deposit.amount  — amount to send (in source token base units)
```

## How It Works

1. **`getQuote`** — calls the swaps.xyz `getAction` endpoint. The raw response is stored in `quote.metadata` so that `createDeposit` can avoid a second network round-trip when `refundAddress` matches the address used at quote time.
2. **`createDeposit`** — if `refundAddress` differs from the address used at quote time (or if a placeholder was used), a fresh `getAction` call is made with the correct sender before returning the deposit details.
3. **`getStatus`** — polls `getStatus` by `txId` and maps the provider status to the canonical `'pending' | 'success' | 'failed'` enum.
