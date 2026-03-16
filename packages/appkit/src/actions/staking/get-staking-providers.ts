/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';

export type GetStakingProvidersReturnType = string[];

/**
 * Get available staking provider IDs
 */
export const getStakingProviders = (appKit: AppKit): GetStakingProvidersReturnType => {
    return appKit.stakingManager.getRegisteredProviders();
};
