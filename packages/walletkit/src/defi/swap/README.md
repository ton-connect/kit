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

kit.swap.registerProvider('omniston', omnistonProvider);
kit.swap.setDefaultProvider('omniston');
```

## Getting a Quote

```typescript
import type { OmnistonProviderOptions } from '@ton/walletkit/swap/omniston';

const quote = await kit.swap.getQuote({
    fromToken: 'TON',
    toToken: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs', // USDT
    amount: '1000000000', // 1 TON in nanotons
    network: Network.mainnet(),
    slippageBps: 100, // 1% slippage
    
    // Provider-specific options (optional)
    providerOptions: {
        referrerAddress: 'EQ...',
        referrerFeeBps: 10, // 0.1%
        flexibleReferrerFee: true,
    } as OmnistonProviderOptions,
});

console.log('You will receive:', quote.toAmount);
console.log('Minimum received:', quote.minReceived);
console.log('Price impact:', quote.priceImpact);
```

## Executing a Swap

```typescript
const transaction = await kit.swap.buildSwapTransaction({
    quote,
    userAddress: 'EQ...',
    destinationAddress: 'EQ...', // Optional: send swapped tokens to different address
    
    // Provider-specific options (optional)
    providerOptions: {
        referrerAddress: 'EQ...',
    } as OmnistonProviderOptions,
});

// Sign and send transaction
await kit.handleNewTransaction(wallet, transaction);
```

## Creating a Custom Swap Provider

To create your own swap provider, extend the `SwapProvider` base class:

```typescript
import { SwapProvider } from '@ton/walletkit/swap';
import type { SwapQuoteParams, SwapQuote, SwapParams } from '@ton/walletkit/swap';
import type { TransactionRequest } from '@ton/walletkit';

// Define provider-specific options
interface MyProviderOptions {
    customParam?: string;
    feePercent?: number;
}

export class MySwapProvider extends SwapProvider<MyProviderOptions> {
    async getQuote(params: SwapQuoteParams<MyProviderOptions>): Promise<SwapQuote> {
        const { fromToken, toToken, amount, network, providerOptions } = params;
        
        // Use providerOptions if provided
        const customParam = providerOptions?.customParam;
        
        // Implement your quote logic
        const response = await fetch('https://api.mydex.com/quote', {
            method: 'POST',
            body: JSON.stringify({
                from: fromToken,
                to: toToken,
                amount,
                customParam,
            }),
        });
        
        const data = await response.json();
        
        return {
            fromToken,
            toToken,
            fromAmount: amount,
            toAmount: data.outputAmount,
            minReceived: data.minOutput,
            network,
            priceImpact: data.priceImpact,
            provider: 'mydex',
            expiresAt: Math.floor(Date.now() / 1000) + 30, // 30 seconds
            metadata: data, // Store provider-specific data
        };
    }
    
    async buildSwapTransaction(params: SwapParams<MyProviderOptions>): Promise<TransactionRequest> {
        const { quote, userAddress, destinationAddress, providerOptions } = params;
        
        // Build transaction using your DEX's API or smart contracts
        const response = await fetch('https://api.mydex.com/build-tx', {
            method: 'POST',
            body: JSON.stringify({
                quote: quote.metadata,
                user: userAddress,
                destination: destinationAddress || userAddress,
            }),
        });
        
        const data = await response.json();
        
        return {
            fromAddress: userAddress,
            messages: data.messages.map(msg => ({
                address: msg.to,
                amount: msg.value,
                payload: msg.payload,
                stateInit: msg.stateInit,
            })),
            network: quote.network,
            validUntil: data.validUntil,
        };
    }
}
```

### Register Your Provider

```typescript
const myProvider = new MySwapProvider();
kit.swap.registerProvider('mydex', myProvider);

// Use it
const quote = await kit.swap.getQuote(
    {
        fromToken: 'TON',
        toToken: 'USDT',
        amount: '1000000000',
        network: Network.mainnet(),
        providerOptions: {
            customParam: 'value',
            feePercent: 0.3,
        },
    },
    'mydex' // Specify provider
);
```

## Available Providers

- **[Omniston](./omniston/README.md)**: STON.fi aggregator supporting multiple DEXs
- More providers coming soon...

## API Reference

### SwapManager

#### `getQuote(params, provider?)`
Get a quote for token swap.

**Parameters:**
- `params: SwapQuoteParams<TProviderOptions>` - Quote parameters
  - `fromToken: string` - Source token address or 'TON'
  - `toToken: string` - Destination token address or 'TON'
  - `amount: string` - Amount in token's smallest units
  - `network: Network` - Network to use
  - `slippageBps?: number` - Slippage tolerance in basis points
  - `providerOptions?: TProviderOptions` - Provider-specific options
- `provider?: string` - Provider name (uses default if not specified)

**Returns:** `Promise<SwapQuote>`

#### `buildSwapTransaction(params, provider?)`
Build transaction for executing swap.

**Parameters:**
- `params: SwapParams<TProviderOptions>` - Swap parameters
  - `quote: SwapQuote` - Quote from getQuote
  - `userAddress: string` - User's wallet address
  - `destinationAddress?: string` - Optional recipient address
  - `slippageBps?: number` - Override slippage
  - `deadline?: number` - Transaction deadline
  - `providerOptions?: TProviderOptions` - Provider-specific options
- `provider?: string` - Provider name

**Returns:** `Promise<TransactionRequest>`

#### `registerProvider(name, provider)`
Register a new swap provider.

#### `setDefaultProvider(name)`
Set default provider for swap operations.

## Examples

See the [demo wallet](../../../apps/demo-wallet/src/pages/Swap.tsx) for a complete implementation example.
