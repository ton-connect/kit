/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CryptoOnrampQuote, CryptoOnrampQuoteParams } from '../../crypto-onramp';
import type { AppKit } from '../../core/app-kit';

export type GetCryptoOnrampQuoteOptions<T = unknown> = CryptoOnrampQuoteParams<T> & {
    providerId?: string;
};

export type GetCryptoOnrampQuoteReturnType = Promise<CryptoOnrampQuote>;

/**
 * Get a crypto onramp quote
 */
export const getCryptoOnrampQuote = async <T = unknown>(
    appKit: AppKit,
    options: GetCryptoOnrampQuoteOptions<T>,
): GetCryptoOnrampQuoteReturnType => {
    return appKit.cryptoOnrampManager.getQuote(options, options.providerId);
};
