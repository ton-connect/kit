/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CryptoOnrampAPI, CryptoOnrampProviderInterface } from '../../api/interfaces';
import type {
    CryptoOnrampDeposit,
    CryptoOnrampDepositParams,
    CryptoOnrampQuote,
    CryptoOnrampQuoteParams,
    CryptoOnrampStatus,
    CryptoOnrampStatusParams,
} from '../../api/models';
import { CryptoOnrampError } from './errors';
import { globalLogger } from '../../core/Logger';
import { DefiManager } from '../DefiManager';

const log = globalLogger.createChild('CryptoOnrampManager');

/**
 * CryptoOnrampManager — manages crypto onramp providers and delegates crypto onramp operations.
 *
 * Allows registration of multiple crypto onramp providers and provides a unified API
 * for crypto-to-TON onramp operations. Providers can be switched dynamically.
 */
export class CryptoOnrampManager extends DefiManager<CryptoOnrampProviderInterface> implements CryptoOnrampAPI {
    /**
     * Get a quote for onramping from another crypto asset into a TON asset
     * @param params - Quote parameters
     * @param providerId - Optional provider name to use
     * @returns Promise resolving to a crypto onramp quote
     */
    async getQuote<TProviderOptions = unknown>(
        params: CryptoOnrampQuoteParams<TProviderOptions>,
        providerId?: string,
    ): Promise<CryptoOnrampQuote> {
        const selectedProviderId = providerId || this.defaultProviderId;
        log.debug('Getting crypto onramp quote', {
            sourceCurrencyAddress: params.sourceCurrencyAddress,
            sourceNetwork: params.sourceNetwork,
            targetCurrencyAddress: params.targetCurrencyAddress,
            amount: params.amount,
            isSourceAmount: params.isSourceAmount,
            providerId: selectedProviderId,
        });

        try {
            const quote = await this.getProvider(selectedProviderId).getQuote(params);

            log.debug('Received crypto onramp quote', {
                sourceAmount: quote.sourceAmount,
                targetAmount: quote.targetAmount,
                rate: quote.rate,
            });

            return quote;
        } catch (error) {
            log.error('Failed to get crypto onramp quote', { error, params });
            throw error;
        }
    }

    /**
     * Create a deposit for a previously obtained quote
     * @param params - Deposit parameters including the quote and user TON address
     * @param providerId - Optional provider name to use
     * @returns Promise resolving to deposit details
     */
    async createDeposit<TProviderOptions = unknown>(
        params: CryptoOnrampDepositParams<TProviderOptions>,
        providerId?: string,
    ): Promise<CryptoOnrampDeposit> {
        const selectedProviderId = providerId || params.quote?.providerId || this.defaultProviderId;

        log.debug('Creating crypto onramp deposit', {
            providerId: selectedProviderId,
            userAddress: params.userAddress,
        });

        try {
            const deposit = await this.getProvider(selectedProviderId).createDeposit(params);

            log.debug('Created crypto onramp deposit', {
                address: deposit.address,
                amount: deposit.amount,
                sourceCurrencyAddress: deposit.sourceCurrencyAddress,
                sourceNetwork: deposit.sourceNetwork,
            });

            return deposit;
        } catch (error) {
            log.error('Failed to create crypto onramp deposit', { error, params });
            throw error;
        }
    }

    /**
     * Get the status of a deposit
     * @param params - Deposit status parameters including the deposit ID
     * @param providerId - Optional provider name to use
     * @returns Promise resolving to the deposit status
     */
    async getStatus(params: CryptoOnrampStatusParams, providerId?: string): Promise<CryptoOnrampStatus> {
        const selectedProviderId = providerId || this.defaultProviderId;

        log.debug('Getting crypto onramp deposit status', {
            providerId: selectedProviderId,
            depositId: params.depositId,
        });

        try {
            const status = await this.getProvider(selectedProviderId).getStatus(params);

            log.debug('Received crypto onramp deposit status', {
                status,
            });

            return status;
        } catch (error) {
            log.error('Failed to get crypto onramp deposit status', { error, params });
            throw error;
        }
    }

    protected createError(message: string, code: string, details?: unknown): CryptoOnrampError {
        return new CryptoOnrampError(message, code, details);
    }
}
