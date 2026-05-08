/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CryptoOnrampQuote, CryptoOnrampQuoteParams } from '../../crypto-onramp';
import type { AppKit } from '../../core/app-kit';

/**
 * Options for {@link getCryptoOnrampQuote} — extends {@link CryptoOnrampQuoteParams} with an optional provider override.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type GetCryptoOnrampQuoteOptions<T = unknown> = CryptoOnrampQuoteParams<T> & {
    /** Provider to quote against; defaults to the registered default provider. */
    providerId?: string;
};

/**
 * Return type of {@link getCryptoOnrampQuote}.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type GetCryptoOnrampQuoteReturnType = Promise<CryptoOnrampQuote>;

/**
 * Quote a crypto-to-TON onramp — given a source asset/chain and target TON asset, returns the rate, expected amount, and provider metadata needed to call {@link createCryptoOnrampDeposit}.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link GetCryptoOnrampQuoteOptions} Source asset, target asset, amount and optional provider override.
 * @returns Quote with pricing details and the provider metadata required to create a deposit.
 *
 * @expand options
 *
 * @public
 * @category Action
 * @section Crypto Onramp
 */
export const getCryptoOnrampQuote = async <T = unknown>(
    appKit: AppKit,
    options: GetCryptoOnrampQuoteOptions<T>,
): GetCryptoOnrampQuoteReturnType => {
    return appKit.cryptoOnrampManager.getQuote(options, options.providerId);
};
