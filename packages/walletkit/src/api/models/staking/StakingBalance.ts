/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TokenAmount } from '../core/TokenAmount';

/**
 * Staking balance information for a user
 */
export interface StakingBalance {
    /**
     * Amount currently staked
     */
    stakedBalance: TokenAmount;

    /**
     * Amount available for instant unstake
     */
    instantUnstakeAvailable: TokenAmount;

    /**
     * Identifier of the staking provider
     */
    providerId: string;
}
