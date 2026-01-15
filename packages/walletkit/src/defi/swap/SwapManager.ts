/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TransactionRequest } from '../../api/models';
import type { SwapAPI, SwapQuoteParams, SwapQuote, SwapParams, SwapProviderInterface } from './types';
import { SwapError } from './errors';
import { globalLogger } from '../../core/Logger';
import { DefiManager } from '../DefiManager';

const log = globalLogger.createChild('SwapManager');

/**
 * SwapManager - manages swap providers and delegates swap operations
 *
 * Allows registration of multiple swap providers and provides a unified API
 * for swap operations. Providers can be switched dynamically.
 */
export class SwapManager extends DefiManager<SwapProviderInterface> implements SwapAPI {
    /**
     * Get a quote for swapping tokens
     * @param params - Quote parameters
     * @param provider - Optional provider name to use
     * @returns Promise resolving to swap quote
     */
    async getQuote(params: SwapQuoteParams, provider?: string): Promise<SwapQuote> {
        log.debug('Getting swap quote', {
            fromToken: params.fromToken,
            toToken: params.toToken,
            amount: params.amount,
            provider: provider || this.defaultProvider,
        });

        try {
            const quote = await this.getProvider(provider).getQuote(params);

            log.debug('Received swap quote', {
                fromAmount: quote.fromAmount,
                toAmount: quote.toAmount,
                priceImpact: quote.priceImpact,
            });

            return quote;
        } catch (error) {
            log.error('Failed to get swap quote', { error, params });
            throw error;
        }
    }

    /**
     * Build a transaction for executing a swap
     * @param params - Swap parameters including quote
     * @param provider - Optional provider name to use
     * @returns Promise resolving to transaction request
     */
    async buildSwapTransaction(params: SwapParams, provider?: string): Promise<TransactionRequest> {
        log.debug('Building swap transaction', {
            userAddress: params.userAddress,
            provider: provider || this.defaultProvider,
        });

        try {
            const transaction = await this.getProvider(provider).buildSwapTransaction(params);

            log.debug('Built swap transaction', params.quote);

            return transaction;
        } catch (error) {
            log.error('Failed to build swap transaction', { error, params });
            throw error;
        }
    }

    protected createError(message: string, code: string, details?: unknown): SwapError {
        return new SwapError(message, code, details);
    }
}
