/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TransactionRequest, SwapQuoteParams, SwapQuote, SwapParams } from '../../api/models';
import type { SwapProviderInterface } from '../../api/interfaces';

/**
 * Abstract base class for swap providers
 *
 * Provides a common interface for implementing swap functionality
 * across different DEXs and protocols.
 *
 * @example
 * ```typescript
 * class MySwapProvider extends SwapProvider {
 *   async getQuote(params: SwapQuoteParams): Promise<SwapQuote> {
 *     // Implementation
 *   }
 *
 *   async buildSwapTransaction(params: SwapParams): Promise<TransactionRequest> {
 *     // Implementation
 *   }
 * }
 * ```
 */
export abstract class SwapProvider<
    TQuoteOptions = undefined,
    TSwapOptions = undefined,
> implements SwapProviderInterface<TQuoteOptions, TSwapOptions> {
    abstract readonly providerId: string;

    /**
     * Get a quote for swapping tokens
     * @param params - Quote parameters including tokens, amount, and network
     * @returns Promise resolving to swap quote with pricing information
     */
    abstract getQuote(params: SwapQuoteParams<TQuoteOptions>): Promise<SwapQuote>;

    /**
     * Build a transaction for executing the swap
     * @param params - Swap parameters including quote and user address
     * @returns Promise resolving to transaction request ready to be signed
     */
    abstract buildSwapTransaction(params: SwapParams<TSwapOptions>): Promise<TransactionRequest>;
}
