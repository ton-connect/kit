/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StakingProviderMetadataOverride } from '../../../../api/models';

export interface TonStakersChainConfig {
    /**
     * optional TonAPI key for APY requests only. If not provided, APY will be available, but if you're using TonAPI, it's recommended to provide the key.
     */
    tonApiToken?: string;
    /**
     * optional override to customize provider metadata.
     */
    metadata?: StakingProviderMetadataOverride;
}

/**
 * Configuration for TonStakersStakingProvider
 */
export interface TonStakersProviderConfig {
    [chainId: string]: TonStakersChainConfig;
}
