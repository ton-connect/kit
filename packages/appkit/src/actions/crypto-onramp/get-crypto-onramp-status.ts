/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CryptoOnrampStatus, CryptoOnrampStatusParams } from '../../crypto-onramp';
import type { AppKit } from '../../core/app-kit';

export type GetCryptoOnrampStatusOptions = CryptoOnrampStatusParams & {
    providerId?: string;
};

export type GetCryptoOnrampStatusReturnType = Promise<CryptoOnrampStatus>;

/**
 * Get a crypto onramp quote
 */
export const getCryptoOnrampStatus = async (
    appKit: AppKit,
    options: GetCryptoOnrampStatusOptions,
): GetCryptoOnrampStatusReturnType => {
    return appKit.cryptoOnrampManager.getStatus(options, options.providerId);
};
