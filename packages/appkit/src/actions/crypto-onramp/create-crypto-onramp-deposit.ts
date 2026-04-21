/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CryptoOnrampDeposit, CryptoOnrampDepositParams } from '../../crypto-onramp';
import type { AppKit } from '../../core/app-kit';

export type CreateCryptoOnrampDepositOptions<T = unknown> = CryptoOnrampDepositParams<T> & {
    providerId?: string;
};

export type CreateCryptoOnrampDepositReturnType = Promise<CryptoOnrampDeposit>;

/**
 * Create a crypto onramp deposit from a previously obtained quote
 */
export const createCryptoOnrampDeposit = async <T = unknown>(
    appKit: AppKit,
    options: CreateCryptoOnrampDepositOptions<T>,
): CreateCryptoOnrampDepositReturnType => {
    return appKit.cryptoOnrampManager.createDeposit(options, options.providerId);
};
