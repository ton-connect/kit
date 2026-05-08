/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { StakingProviderInfo } from '../../staking';
import type { Network } from '../../types/network';
import { resolveNetwork } from '../../utils';

export type GetStakingProviderInfoOptions = {
    network?: Network;
    providerId?: string;
};

export type GetStakingProviderInfoReturnType = Promise<StakingProviderInfo>;

/**
 * Get staking provider info
 */
export const getStakingProviderInfo = async (
    appKit: AppKit,
    options: GetStakingProviderInfoOptions = {},
): GetStakingProviderInfoReturnType => {
    return appKit.stakingManager.getStakingProviderInfo(resolveNetwork(appKit, options.network), options.providerId);
};
