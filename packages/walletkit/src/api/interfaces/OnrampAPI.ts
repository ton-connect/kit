/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { OnrampParams, OnrampProviderMetadata, OnrampQuote, OnrampQuoteParams } from '../models';
import type { DefiManagerAPI } from './DefiManagerAPI';
import type { DefiProvider } from './DefiProvider';

/**
 * Onramp API interface exposed by OnrampManager
 */
export interface OnrampAPI extends DefiManagerAPI<OnrampProviderInterface> {
    /**
     * Get quotes for onramping fiat to crypto from all registered providers.
     * Each provider may emit one or many quotes; results are flattened.
     * @param params Quote parameters (fiat, crypto, amount, etc.)
     * @returns A promise that resolves to a flat array of OnrampQuotes
     */
    getQuotes(params: OnrampQuoteParams): Promise<OnrampQuote[]>;

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
export interface OnrampProviderInterface<TQuoteOptions = unknown, TOnrampOptions = unknown> extends DefiProvider {
    readonly type: 'onramp';

    /**
     * Unique identifier for the provider
     */
    readonly providerId: string;

    /**
     * Get static metadata for the provider (display name, logo, capability flags).
     */
    getMetadata(): OnrampProviderMetadata;

    /**
     * Get a quote (or quotes) for onramping fiat to crypto.
     * Aggregating providers may return multiple quotes from a single call;
     * single-source providers may return one quote directly.
     * @param params Quote parameters including provider-specific options
     */
    getQuote(params: OnrampQuoteParams<TQuoteOptions>): Promise<OnrampQuote | OnrampQuote[]>;

    /**
     * Build an onramp URL for redirecting the user to the provider
     * @param params Onramp parameters including provider-specific options
     * @returns A promise that resolves to a URL string
     */
    buildOnrampUrl(params: OnrampParams<TOnrampOptions>): Promise<string>;
}
