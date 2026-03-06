/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress } from '../../../../api/models';

/**
 * Options for configuring the referrer in Omniston swap operations
 */
export interface OmnistonReferrerOptions {
    /**
     * The address of the referrer
     */
    referrerAddress?: UserFriendlyAddress;

    /**
     * Referrer fee in basis points (1 bp = 0.01%)
     * @format int
     */
    referrerFeeBps?: number;

    /**
     * Whether a flexible referrer fee is allowed
     */
    flexibleReferrerFee?: boolean;
}
