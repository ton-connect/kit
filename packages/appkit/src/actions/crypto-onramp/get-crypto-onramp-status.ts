/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CryptoOnrampStatus, CryptoOnrampStatusParams } from '../../crypto-onramp';
import type { AppKit } from '../../core/app-kit';

/**
 * Options for {@link getCryptoOnrampStatus} — extends {@link CryptoOnrampStatusParams} with an optional provider override.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type GetCryptoOnrampStatusOptions = CryptoOnrampStatusParams & {
    /** Provider that issued the deposit; defaults to the registered default provider. */
    providerId?: string;
};

/**
 * Return type of {@link getCryptoOnrampStatus}.
 *
 * @public
 * @category Type
 * @section Crypto Onramp
 */
export type GetCryptoOnrampStatusReturnType = Promise<CryptoOnrampStatus>;

/**
 * Read the current status of a crypto-onramp deposit by id — typically polled until the result is `'success'` or `'failed'`.
 *
 * @param appKit - {@link AppKit} Runtime instance.
 * @param options - {@link GetCryptoOnrampStatusOptions} Deposit id, originating provider id and optional provider override.
 * @returns Current {@link CryptoOnrampStatus} of the deposit.
 *
 * @expand options
 *
 * @public
 * @category Action
 * @section Crypto Onramp
 */
export const getCryptoOnrampStatus = async (
    appKit: AppKit,
    options: GetCryptoOnrampStatusOptions,
): GetCryptoOnrampStatusReturnType => {
    return appKit.cryptoOnrampManager.getStatus(options, options.providerId);
};
