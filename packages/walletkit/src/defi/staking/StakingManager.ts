/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TransactionRequest } from '../../api/models';
import type { StakingAPI, SwapQuoteParams, SwapQuote, SwapParams, StakingProviderInterface } from './types';
import { StakingError } from './errors';
import { globalLogger } from '../../core/Logger';
import { DefiManager } from '../DefiManager';

const log = globalLogger.createChild('StakingManager');

export class StakingManager extends DefiManager<StakingProviderInterface> implements StakingAPI {
    async getQuote(params: SwapQuoteParams, provider?: string): Promise<SwapQuote> {
        log.debug('Getting staking quote', {
            fromToken: params.fromToken,
            toToken: params.toToken,
            amount: params.amount,
            provider: provider || this.defaultProvider,
        });

        try {
            const quote = await this.getProvider(provider).getQuote(params);

            log.debug('Received staking quote', {
                fromAmount: quote.fromAmount,
                toAmount: quote.toAmount,
                priceImpact: quote.priceImpact,
            });

            return quote;
        } catch (error) {
            log.error('Failed to get staking quote', { error, params });
            throw error;
        }
    }

    async buildStakingTransaction(params: SwapParams, provider?: string): Promise<TransactionRequest> {
        log.debug('Building staking transaction', {
            userAddress: params.userAddress,
            provider: provider || this.defaultProvider,
        });

        try {
            const transaction = await this.getProvider(provider).buildSwapTransaction(params);

            log.debug('Built staking transaction', params.quote);

            return transaction;
        } catch (error) {
            log.error('Failed to build staking transaction', { error, params });
            throw error;
        }
    }

    protected createError(message: string, code: string, details?: unknown): StakingError {
        return new StakingError(message, code, details);
    }
}
