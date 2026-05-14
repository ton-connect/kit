/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Onramp limits specify the boundaries of what a user can purchase.
 */
export interface OnrampLimits {
    /**
     * Minimum fiat amount allowed.
     */
    minBaseAmount: number;

    /**
     * Maximum fiat amount allowed.
     */
    maxBaseAmount: number;

    /**
     * Minimum crypto amount allowed.
     */
    minQuoteAmount?: number;

    /**
     * Maximum crypto amount allowed.
     */
    maxQuoteAmount?: number;

    /**
     * Provider identifier.
     */
    providerId: string;
}
