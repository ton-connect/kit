/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SwapParams, SwapQuote, SwapQuoteParams, TransactionRequest } from '../models';
import type { DefiManagerAPI } from './DefiManagerAPI';
import type { DefiProvider } from './DefiProvider';

/**
 * Swap API interface exposed by SwapManager
 */
export interface SwapAPI extends DefiManagerAPI<SwapProviderInterface> {
    /**
     * Get a quote for swapping tokens
     * @param params Quote parameters (tokens, amount, etc.)
     * @param providerId Provider identifier (optional, uses default if not specified)
     * @returns A promise that resolves to a SwapQuote
     */
    getQuote(params: SwapQuoteParams, providerId?: string): Promise<SwapQuote>;

    /**
     * Build a transaction for a swap
     * @param params Swap parameters (quote, user address, etc.)
     * @param providerId Provider identifier (optional, uses default if not specified)
     * @returns A promise that resolves to a TransactionRequest
     */
    buildSwapTransaction(params: SwapParams, providerId?: string): Promise<TransactionRequest>;
}

/**
 * Interface that all swap providers must implement
 */
export interface SwapProviderInterface<TQuoteOptions = unknown, TSwapOptions = unknown> extends DefiProvider {
    readonly type: 'swap';

    /**
     * Unique identifier for the provider
     */
    readonly providerId: string;

    /**
     * Get a quote for swapping tokens
     * @param params Quote parameters including provider-specific options
     * @returns A promise that resolves to a SwapQuote
     */
    getQuote(params: SwapQuoteParams<TQuoteOptions>): Promise<SwapQuote>;

    /**
     * Build a transaction for a swap
     * @param params Swap parameters including provider-specific options
     * @returns A promise that resolves to a TransactionRequest
     */
    buildSwapTransaction(params: SwapParams<TSwapOptions>): Promise<TransactionRequest>;
}
