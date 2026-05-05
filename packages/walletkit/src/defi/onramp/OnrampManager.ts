/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { OnrampAPI, OnrampProviderInterface } from '../../api/interfaces';
import type { OnrampParams, OnrampQuote, OnrampQuoteParams } from '../../api/models';
import { OnrampError } from './errors';
import { globalLogger } from '../../core/Logger';
import { DefiManager } from '../DefiManager';

const log = globalLogger.createChild('OnrampManager');

/**
 * OnrampManager - manages onramp providers and delegates onramp operations
 *
 * Allows registration of multiple onramp providers and provides a unified API
 * for fiat-to-crypto onramp operations. Providers can be switched dynamically.
 */
export class OnrampManager extends DefiManager<OnrampProviderInterface> implements OnrampAPI {
    /**
     * Get quotes for onramping fiat to crypto from all registered providers.
     * Each provider may return one quote or an array; results are flattened.
     * @param params - Quote parameters
     * @returns Promise resolving to a flat array of onramp quotes
     */
    async getQuotes<TProviderOptions = unknown>(params: OnrampQuoteParams<TProviderOptions>): Promise<OnrampQuote[]> {
        log.debug('Getting onramp quotes from all providers', {
            fiatCurrency: params.fiatCurrency,
            cryptoCurrency: params.cryptoCurrency,
            amount: params.amount,
            isFiatAmount: params.isFiatAmount,
        });

        const providers = this.getProviders();

        const results = await Promise.allSettled(
            providers.map((provider: OnrampProviderInterface) => provider.getQuote(params)),
        );

        const quotes: OnrampQuote[] = [];

        results.forEach((result: PromiseSettledResult<OnrampQuote | OnrampQuote[]>, index: number) => {
            if (result.status === 'fulfilled') {
                if (Array.isArray(result.value)) {
                    quotes.push(...result.value);
                    return;
                }

                quotes.push(result.value);
            } else {
                log.debug(`Provider ${providers[index].providerId} failed to return a quote`, {
                    error: result.reason,
                    params,
                });
            }
        });

        log.debug(`Received ${quotes.length} onramp quotes`, {
            successfulProviders: quotes.map((q) => q.providerId),
        });

        if (quotes.length === 0) {
            throw new OnrampError(
                `No onramp service supports ${params.fiatCurrency} → ${params.cryptoCurrency}`,
                OnrampError.PAIR_NOT_SUPPORTED,
                {
                    fiatCurrency: params.fiatCurrency,
                    cryptoCurrency: params.cryptoCurrency,
                },
            );
        }

        return quotes;
    }

    /**
     * Build an onramp URL for redirecting the user to the provider
     * @param params - Onramp parameters including quote
     * @param providerId - Optional provider name to use
     * @returns Promise resolving to a URL string
     */
    async buildOnrampUrl<TProviderOptions = unknown>(
        params: OnrampParams<TProviderOptions>,
        providerId?: string,
    ): Promise<string> {
        const selectedProviderId = providerId || params.quote?.providerId || this.defaultProviderId;

        log.debug('Building onramp URL', {
            providerId: selectedProviderId,
            userAddress: params.userAddress,
        });

        try {
            const url = await this.getProvider(selectedProviderId).buildOnrampUrl(params);

            log.debug('Built onramp URL', { url: url.substring(0, 50) + '...' });

            return url;
        } catch (error) {
            log.error('Failed to build onramp URL', { error, params });
            throw error;
        }
    }

    protected createError(message: string, code: string, details?: unknown): OnrampError {
        return new OnrampError(message, code, details);
    }
}
