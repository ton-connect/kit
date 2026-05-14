/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Parameters identifying a previously created crypto-onramp deposit — pair of `depositId` and the `providerId` that issued it.
 */
export interface CryptoOnrampStatusParams {
    /**
     * Deposit id.
     */
    depositId: string;

    /**
     * Identifier of the provider that issued this deposit.
     */
    providerId: string;
}
