/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { CryptoOnrampProviderInterface } from '../../crypto-onramp';

export interface GetCryptoOnrampProviderOptions {
    id?: string;
}

export type GetCryptoOnrampProviderReturnType = CryptoOnrampProviderInterface;

/**
 * Get a registered crypto-onramp provider by id, or the default one when no id is given.
 */
export const getCryptoOnrampProvider = (
    appKit: AppKit,
    options: GetCryptoOnrampProviderOptions = {},
): GetCryptoOnrampProviderReturnType => {
    return appKit.cryptoOnrampManager.getProvider(options.id);
};
