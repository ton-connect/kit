/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StakingManager } from '@ton/walletkit';

import type { AppKit } from '../../core/app-kit';

export type GetStakingManagerReturnType = StakingManager;

/**
 * Get staking manager instance
 */
export const getStakingManager = (appKit: AppKit): GetStakingManagerReturnType => {
    return appKit.stakingManager;
};
