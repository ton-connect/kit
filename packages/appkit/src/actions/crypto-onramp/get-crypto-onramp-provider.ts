/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { CryptoOnrampProviderInterface } from '../../crypto-onramp';

/**
 * Options for {@link getCryptoOnrampProvider}.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export interface GetCryptoOnrampProviderOptions {
    /** Provider id to look up; when omitted, returns the registered default provider. */
    id?: string;
}

/**
 * Return type of {@link getCryptoOnrampProvider}.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type GetCryptoOnrampProviderReturnType = CryptoOnrampProviderInterface;

/**
 * Get a registered crypto-onramp provider by id, or the default provider when no id is given; throws when no provider matches — or when no id is passed and no default has been registered.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link GetCryptoOnrampProviderOptions} Optional provider id.
 * @returns The matching {@link CryptoOnrampProviderInterface}.
 *
 * @sample docs/examples/src/appkit/actions/onramp#GET_CRYPTO_ONRAMP_PROVIDER
 * @expand options
 *
 * @public
 * @category Action
 * @section Crypto Onramp
 */
export const getCryptoOnrampProvider = (
    appKit: AppKit,
    options: GetCryptoOnrampProviderOptions = {},
): GetCryptoOnrampProviderReturnType => {
    return appKit.cryptoOnrampManager.getProvider(options.id);
};
