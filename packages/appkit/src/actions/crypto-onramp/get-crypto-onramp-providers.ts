/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CryptoOnrampProviderInterface } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';

export type GetCryptoOnrampProvidersReturnType = CryptoOnrampProviderInterface[];

/**
 * Get all registered crypto-onramp providers.
 */
export const getCryptoOnrampProviders = (appKit: AppKit): GetCryptoOnrampProvidersReturnType => {
    return appKit.cryptoOnrampManager.getProviders();
};
