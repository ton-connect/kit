/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { StakingProviderInterface } from '../../staking';

export type GetStakingProvidersReturnType = StakingProviderInterface[];

/**
 * Get all registered staking providers.
 */
export const getStakingProviders = (appKit: AppKit): GetStakingProvidersReturnType => {
    return appKit.stakingManager.getProviders();
};
