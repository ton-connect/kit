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
     * Amount currently staked, in raw smallest units of the stake token (e.g., nano-TON).
     */
    rawStakedBalance: TokenAmount;

    /**
     * Amount currently staked, formatted to the stake token's decimals as a human-readable decimal string (e.g., `"12.5"`).
     */
    stakedBalance: string;

    /**
     * Amount available for instant unstake, in raw smallest units of the stake token (e.g., nano-TON).
     */
    rawInstantUnstakeAvailable: TokenAmount;

    /**
     * Amount available for instant unstake, formatted to the stake token's decimals as a human-readable decimal string (e.g., `"12.5"`).
     */
    instantUnstakeAvailable: string;

    /**
     * Identifier of the staking provider
     */
    providerId: string;
}
