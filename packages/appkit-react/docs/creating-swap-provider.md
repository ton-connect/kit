# Creating a Swap Provider

AppKit swap providers are pluggable. Any DEX or protocol can integrate by extending the `SwapProvider` class and implementing two methods.

## Interface

```ts
abstract class SwapProvider<TQuoteOptions = undefined, TSwapOptions = undefined> {
    readonly type = 'swap';
    abstract readonly providerId: string;

    abstract getQuote(params: SwapQuoteParams<TQuoteOptions>): Promise<SwapQuote>;
    abstract buildSwapTransaction(params: SwapParams<TSwapOptions>): Promise<TransactionRequest>;
}
```

### `getQuote`

Receives quote parameters and returns pricing information.

**Params (`SwapQuoteParams`):**

| Field              | Type          | Description                                       |
|--------------------|---------------|---------------------------------------------------|
| `amount`           | `string`      | Amount in raw units                               |
| `fromToken`        | `SwapToken`   | Source token (`{ type: 'ton' }` or `{ type: 'jetton', value: address }`) |
| `toToken`          | `SwapToken`   | Destination token                                 |
| `network`          | `Network`     | Network for the swap                              |
| `slippageBps`      | `number?`     | Slippage tolerance in basis points (100 = 1%)     |
| `isReverseSwap`    | `boolean?`    | If true, `amount` is the desired output           |
| `providerOptions`  | `TQuoteOptions?` | Provider-specific options                      |

**Returns (`SwapQuote`):**

| Field         | Type          | Description                            |
|---------------|---------------|----------------------------------------|
| `providerId`  | `string`      | Your provider identifier               |
| `fromToken`   | `SwapToken`   | Source token                           |
| `toToken`     | `SwapToken`   | Destination token                      |
| `fromAmount`  | `string`      | Input amount                           |
| `toAmount`    | `string`      | Estimated output amount                |
| `minReceived` | `string`      | Minimum output after slippage          |
| `network`     | `Network`     | Network                               |
| `metadata`    | `unknown?`    | Provider-specific data passed to `buildSwapTransaction` |

### `buildSwapTransaction`

Takes a quote and user address, returns a transaction ready to be signed.

**Params (`SwapParams`):**

| Field                | Type          | Description                                   |
|----------------------|---------------|-----------------------------------------------|
| `quote`              | `SwapQuote`   | Quote from `getQuote`                         |
| `userAddress`        | `string`      | Sender address                                |
| `destinationAddress` | `string?`     | Recipient address (defaults to sender)        |
| `slippageBps`        | `number?`     | Override slippage                             |

**Returns (`TransactionRequest`):**

| Field      | Type                          | Description                |
|------------|-------------------------------|----------------------------|
| `messages` | `TransactionRequestMessage[]` | Messages to send           |
| `network`  | `Network?`                    | Network                    |

Each message contains `address`, `amount`, and an optional `payload` (Base64-encoded BOC).

## Minimal Example

```ts
import { SwapProvider } from '@ton/walletkit';
import type { SwapQuoteParams, SwapQuote, SwapParams, TransactionRequest } from '@ton/walletkit';

export class MySwapProvider extends SwapProvider {
    readonly providerId = 'my-dex';

    async getQuote(params: SwapQuoteParams): Promise<SwapQuote> {
        // Call your DEX API to get pricing
        const result = await myDexApi.quote(params.fromToken, params.toToken, params.amount);

        return {
            providerId: this.providerId,
            fromToken: params.fromToken,
            toToken: params.toToken,
            fromAmount: params.amount,
            toAmount: result.outputAmount,
            minReceived: result.minReceived,
            network: params.network,
            metadata: result, // pass anything you need in buildSwapTransaction
        };
    }

    async buildSwapTransaction(params: SwapParams): Promise<TransactionRequest> {
        // Build TON messages from the quote
        return {
            fromAddress: params.userAddress,
            messages: [
                {
                    address: '...', // your contract address
                    amount: '...', // amount in nanotons
                    payload: '...', // Base64-encoded BOC
                },
            ],
            network: params.quote.network,
        };
    }
}
```

## Registration

Pass your provider to `AppKit` on initialization:

```ts
const appKit = new AppKit({
    networks: { /* ... */ },
    providers: [new MySwapProvider()],
});
```

Multiple providers can be registered. AppKit uses the first provider by default; pass `providerId` to hooks to target a specific one.
