/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { OnrampFee } from './OnrampFee';
import type { OnrampServiceInfo } from './OnrampServiceInfo';

/**
 * Onramp quote response with pricing information
 */
export interface OnrampQuote<TMetadata = unknown> {
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
     * Fees charged for the transaction
     */
    fees?: OnrampFee[];

    /**
     * Identifier of the registered onramp provider that produced the quote
     */
    providerId: string;

    /**
     * The underlying onramp service that will fulfill this quote
     * (set by aggregating providers like AppkitOnramp).
     */
    serviceInfo?: OnrampServiceInfo;

    /**
     * Provider-specific metadata for the quote (e.g. raw response needed to execute)
     */
    metadata?: TMetadata;
}
