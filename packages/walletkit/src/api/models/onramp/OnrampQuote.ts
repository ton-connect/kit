/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Onramp quote response with pricing information
 */
export interface OnrampQuote {
    /**
     * Fiat currency ticker (e.g. 'USD')
     */
    fiatCurrency: string;

    /**
     * Crypto currency ticker (e.g. 'TON')
     */
    cryptoCurrency: string;

    /**
     * Amount of fiat to spend
     */
    fiatAmount: string;

    /**
     * Amount of crypto to receive
     */
    cryptoAmount: string;

    /**
     * Exchange rate (amount of crypto per 1 unit of fiat)
     */
    rate: string;

    /**
     * Total fees charged for the transaction (in fiat currency)
     */
    fiatFee?: string;

    /**
     * Network fee estimated (in fiat currency)
     */
    networkFeeFiat?: string;

    /**
     * Identifier of the onramp provider
     */
    providerId: string;

    /**
     * Provider-specific metadata for the quote
     */
    metadata?: unknown;
}
