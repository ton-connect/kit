/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    OnrampParams,
    OnrampQuote,
    OnrampQuoteParams,
    OnrampLimits,
    OnrampLimitParams,
    OnrampTransactionStatus,
    OnrampTransactionParams,
} from '../models';
import type { DefiManagerAPI } from './DefiManagerAPI';
import type { DefiProvider } from './DefiProvider';

/**
 * Onramp API interface exposed by OnrampManager
 */
export interface OnrampAPI extends DefiManagerAPI<OnrampProviderInterface> {
    /**
     * Get a quote for onramping fiat to crypto
     * @param params Quote parameters (fiat, crypto, amount, etc.)
     * @param providerId Provider identifier (optional, uses default if not specified)
     * @returns A promise that resolves to an OnrampQuote
     */
    getQuote(params: OnrampQuoteParams, providerId?: string): Promise<OnrampQuote>;

    /**
     * Get fiat/crypto limits for purchasing
     * @param params Limit parameters
     * @param providerId Provider identifier
     * @returns A promise that resolves to OnrampLimits
     */
    getLimits(params: OnrampLimitParams, providerId?: string): Promise<OnrampLimits>;

    /**
     * Get the status of an ongoing or completed transaction
     * @param params Transaction parameters including ID
     * @param providerId Provider identifier
     * @returns A promise that resolves to the transaction status
     */
    getTransactionStatus(params: OnrampTransactionParams, providerId?: string): Promise<OnrampTransactionStatus>;

    /**
     * Build an onramp URL for redirecting the user to the provider
     * @param params Onramp parameters (quote, user address, etc.)
     * @param providerId Provider identifier (optional, uses default if not specified)
     * @returns A promise that resolves to a URL string
     */
    buildOnrampUrl(params: OnrampParams, providerId?: string): Promise<string>;
}

/**
 * Interface that all onramp providers must implement
 */
export interface OnrampProviderInterface<
    TQuoteOptions = unknown,
    TOnrampOptions = unknown,
    TLimitOptions = unknown,
    TTransactionOptions = unknown,
> extends DefiProvider {
    readonly type: 'onramp';

    /**
     * Unique identifier for the provider
     */
    readonly providerId: string;

    /**
     * Get a quote for onramping fiat to crypto
     * @param params Quote parameters including provider-specific options
     * @returns A promise that resolves to an OnrampQuote
     */
    getQuote(params: OnrampQuoteParams<TQuoteOptions>): Promise<OnrampQuote>;

    /**
     * Get fiat/crypto limits for purchasing
     * @param params Limit parameters
     * @returns A promise that resolves to OnrampLimits
     */
    getLimits(params: OnrampLimitParams<TLimitOptions>): Promise<OnrampLimits>;

    /**
     * Get the status of an ongoing or completed transaction
     * @param params Transaction parameters including ID
     * @returns A promise that resolves to the transaction status
     */
    getTransactionStatus(params: OnrampTransactionParams<TTransactionOptions>): Promise<OnrampTransactionStatus>;

    /**
     * Build an onramp URL for redirecting the user to the provider
     * @param params Onramp parameters including provider-specific options
     * @returns A promise that resolves to a URL string
     */
    buildOnrampUrl(params: OnrampParams<TOnrampOptions>): Promise<string>;
}
