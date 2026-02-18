/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TransactionRequest } from '../../api/models';
import type { SwapAPI, SwapProviderInterface } from '../../api/interfaces';
import type { SwapQuoteParams, SwapQuote, SwapParams } from '../../api/models';
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
     * @param providerId - Optional provider name to use
     * @returns Promise resolving to swap quote
     */
    async getQuote<TProviderOptions = unknown>(
        params: SwapQuoteParams<TProviderOptions>,
        providerId?: string,
    ): Promise<SwapQuote> {
        log.debug('Getting swap quote', {
            fromToken: params.from,
            toToken: params.to,
            amount: params.amount,
            isReverseSwap: params.isReverseSwap,
            providerId: providerId || this.defaultProviderId,
        });

        try {
            const quote = await this.getProvider(providerId || this.defaultProviderId).getQuote(params);

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
     * @returns Promise resolving to transaction request
     */
    async buildSwapTransaction<TProviderOptions = unknown>(
        params: SwapParams<TProviderOptions>,
    ): Promise<TransactionRequest> {
        const providerId = params.quote.providerId || this.defaultProviderId;

        log.debug('Building swap transaction', {
            providerId,
            userAddress: params.userAddress,
        });

        try {
            const transaction = await this.getProvider(providerId).buildSwapTransaction(params);

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
