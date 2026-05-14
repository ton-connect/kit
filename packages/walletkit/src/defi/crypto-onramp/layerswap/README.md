<!--
This file is auto-generated. Do not edit manually.
Changes will be overwritten when running the docs update script.
Source template: template/packages/walletkit/src/defi/crypto-onramp/layerswap/README.md
-->

# Layerswap Crypto Onramp Provider

Layerswap is a multi-chain bridge that routes crypto assets from a wide range of source networks and tokens into TON assets.

For more information about supported chains and tokens, see the [official documentation](https://docs.layerswap.io).

## Quick Start

```typescript
import { createLayerswapProvider } from '@ton/walletkit/crypto-onramp/layerswap';

kit.cryptoOnramp.registerProvider(
    createLayerswapProvider({ apiKey: 'your-api-key' }),
);
kit.cryptoOnramp.setDefaultProvider('layerswap');
```

## Configuration

```typescript
interface LayerswapProviderConfig {
    apiKey?: string;   // Optional API key forwarded as X-LS-APIKEY
    apiUrl?: string;   // Default: 'https://api.layerswap.io/api/v2'
}
```

See [Crypto Onramp README](../README.md) for base `CryptoOnrampQuoteParams`. Layerswap does not define any additional provider-specific quote options.

## Usage Example

```typescript
const quote = await kit.cryptoOnramp.getQuote({
    sourceCurrencyAddress: '0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9', // USDT on Arbitrum
    sourceChain: 'eip155:42161',
    targetCurrencyAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', // USDT on TON
    amount: '1000000', // 1 USDT (6 decimals)
    recipientAddress: 'UQ...', // TON address to receive tokens
});

const deposit = await kit.cryptoOnramp.createDeposit({ quote });

// deposit.address — address to send tokens to on the source chain
// deposit.amount  — amount to send (in source token base units)
```

## How It Works

1. **`getQuote`** — creates a Layerswap swap at quote time (POST `/swaps`) and caches the `swapId` and `depositAddress` in `quote.metadata`. No extra network call is needed at deposit time.
2. **`createDeposit`** — reads `swapId` and `depositAddress` directly from `quote.metadata`. No `refundAddress` is required for Layerswap.
3. **`getStatus`** — polls GET `/swaps/{swapId}` and maps the Layerswap status to the canonical `'pending' | 'success' | 'failed'` enum.
