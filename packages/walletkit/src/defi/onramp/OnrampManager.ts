/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { OnrampAPI, OnrampProviderInterface } from '../../api/interfaces';
import type {
    OnrampParams,
    OnrampQuote,
    OnrampQuoteParams,
    OnrampLimits,
    OnrampLimitParams,
    OnrampTransactionStatus,
    OnrampTransactionParams,
} from '../../api/models/onramps';
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
     * Get a quote for onramping fiat to crypto
     * @param params - Quote parameters
     * @param providerId - Optional provider name to use
     * @returns Promise resolving to onramp quote
     */
    async getQuote<TProviderOptions = unknown>(
        params: OnrampQuoteParams<TProviderOptions>,
        providerId?: string,
    ): Promise<OnrampQuote> {
        const selectedProviderId = providerId || this.defaultProviderId;
        log.debug('Getting onramp quote', {
            fiatCurrency: params.fiatCurrency,
            cryptoCurrency: params.cryptoCurrency,
            amount: params.amount,
            isFiatAmount: params.isFiatAmount,
            providerId: selectedProviderId,
        });

        try {
            const quote = await this.getProvider(selectedProviderId).getQuote(params);

            log.debug('Received onramp quote', {
                fiatAmount: quote.fiatAmount,
                cryptoAmount: quote.cryptoAmount,
                rate: quote.rate,
            });

            return quote;
        } catch (error) {
            log.error('Failed to get onramp quote', { error, params });
            throw error;
        }
    }

    /**
     * Get fiat/crypto limits for purchasing
     * @param params - Limit parameters
     * @param providerId - Optional provider name to use
     * @returns Promise resolving to onramp limits
     */
    async getLimits<TProviderOptions = unknown>(
        params: OnrampLimitParams<TProviderOptions>,
        providerId?: string,
    ): Promise<OnrampLimits> {
        const selectedProviderId = providerId || this.defaultProviderId;
        log.debug('Getting onramp limits', {
            fiatCurrency: params.fiatCurrency,
            cryptoCurrency: params.cryptoCurrency,
            providerId: selectedProviderId,
        });

        try {
            const limits = await this.getProvider(selectedProviderId).getLimits(params);

            log.debug('Received onramp limits', {
                minBaseAmount: limits.minBaseAmount,
                maxBaseAmount: limits.maxBaseAmount,
            });

            return limits;
        } catch (error) {
            log.error('Failed to get onramp limits', { error, params });
            throw error;
        }
    }

    /**
     * Get the status of an ongoing or completed transaction
     * @param params - Transaction parameters
     * @param providerId - Optional provider name to use
     * @returns Promise resolving to the transaction status
     */
    async getTransactionStatus<TProviderOptions = unknown>(
        params: OnrampTransactionParams<TProviderOptions>,
        providerId?: string,
    ): Promise<OnrampTransactionStatus> {
        const selectedProviderId = providerId || this.defaultProviderId;
        log.debug('Getting onramp transaction status', {
            transactionId: params.transactionId,
            providerId: selectedProviderId,
        });

        try {
            const status = await this.getProvider(selectedProviderId).getTransactionStatus(params);

            log.debug('Received onramp transaction status', {
                status: status.status,
                transactionId: status.transactionId,
            });

            return status;
        } catch (error) {
            log.error('Failed to get onramp transaction status', { error, params });
            throw error;
        }
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
