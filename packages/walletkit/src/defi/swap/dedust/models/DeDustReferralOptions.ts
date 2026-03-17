/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Options for configuring the referral in DeDust swap operations
 */
export interface DeDustReferralOptions {
    /**
     * The address of the referrer
     */
    referralAddress?: string;

    /**
     * Referral fee in basis points (max 100 = 1%)
     * @format int
     */
    referralFeeBps?: number;
}
