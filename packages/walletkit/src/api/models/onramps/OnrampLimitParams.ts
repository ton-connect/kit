/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface OnrampLimitParams<TProviderOptions = unknown> {
    /**
     * Crypto currency ticker (e.g. 'ton')
     */
    cryptoCurrency: string;

    /**
     * Fiat currency ticker (e.g. 'usd')
     */
    fiatCurrency: string;

    /**
     * Provider-specific options (e.g., paymentMethod)
     */
    providerOptions?: TProviderOptions;
}
