/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '../core/Network';

/**
 * Base parameters for requesting an onramp quote
 */
export interface OnrampQuoteParams<TProviderOptions = unknown> {
    /**
     * Amount to onramp (either fiat or crypto, depending on isFiatAmount)
     */
    amount: string;

    /**
     * Fiat currency ticker (e.g. 'USD', 'EUR')
     */
    fiatCurrency: string;

    /**
     * Crypto currency ticker (e.g. 'TON', 'USDT')
     */
    cryptoCurrency: string;

    /**
     * Network on which the crypto will be received
     */
    network: Network;

    /**
     * Provider-specific options
     */
    providerOptions?: TProviderOptions;

    /**
     * If true, amount is the fiat amount to spend. If false, amount is the crypto amount to receive.
     * Default depends on the provider implementation but usually defaults to true.
     */
    isFiatAmount?: boolean;
}
