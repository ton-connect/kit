/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { StakingProviderInterface } from '../../staking';

export type GetStakingProviderOptions = {
    /**
     * Provider ID to get. If not provided, returns default provider.
     */
    id?: string;
};

export type GetStakingProviderReturnType = StakingProviderInterface;

/**
 * Get staking provider instance
 */
export const getStakingProvider = (
    appKit: AppKit,
    options: GetStakingProviderOptions = {},
): GetStakingProviderReturnType => {
    return appKit.stakingManager.getProvider(options.id);
};
