/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '../../core/app-kit';
import type { StakingProviderMetadata } from '../../staking';
import type { Network } from '../../types/network';
import { resolveNetwork } from '../../utils';

export type GetStakingProviderMetadataOptions = {
    network?: Network;
    providerId?: string;
};

export type GetStakingProviderMetadataReturnType = StakingProviderMetadata;

/**
 * Get staking provider static metadata
 */
export const getStakingProviderMetadata = (
    appKit: AppKit,
    options: GetStakingProviderMetadataOptions = {},
): GetStakingProviderMetadataReturnType => {
    return appKit.stakingManager.getStakingProviderMetadata(
        resolveNetwork(appKit, options.network),
        options.providerId,
    );
};
