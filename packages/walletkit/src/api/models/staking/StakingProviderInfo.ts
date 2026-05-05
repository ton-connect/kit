/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TokenAmount } from '../core/TokenAmount';

/**
 * Staking information for a provider
 */
export interface StakingProviderInfo {
    /**
     * Annual Percentage Yield in basis points (100 = 1%)
     */
    apy: number;

    /**
     * Amount available for instant unstake
     */
    rawInstantUnstakeAvailable?: TokenAmount;

    /**
     * Amount available for instant unstake
     */
    instantUnstakeAvailable?: string;

    /**
     * Identifier of the staking provider
     */
    providerId: string;
}
