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
 * Return type of {@link getCryptoOnrampProviders}.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type GetCryptoOnrampProvidersReturnType = CryptoOnrampProviderInterface[];

/**
 * List every crypto-onramp provider registered on this AppKit instance — both those passed via {@link AppKitConfig}'s `providers` and those added later through {@link registerProvider}.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @returns Array of registered {@link CryptoOnrampProviderInterface}s.
 *
 * @sample docs/examples/src/appkit/actions/onramp#GET_CRYPTO_ONRAMP_PROVIDERS
 *
 * @public
 * @category Action
 * @section Crypto Onramp
 */
export const getCryptoOnrampProviders = (appKit: AppKit): GetCryptoOnrampProvidersReturnType => {
    return appKit.cryptoOnrampManager.getProviders();
};
