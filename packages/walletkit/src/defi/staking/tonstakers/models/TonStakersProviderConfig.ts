/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StakingProviderMetadataOverride } from '../../../../api/models';

export interface TonStakersChainConfig {
    /** TonAPI key used for APY reads. Optional — APY still works without it, but providing one is recommended when you already use TonAPI elsewhere. */
    tonApiToken?: string;
    /** Optional override of the provider metadata surfaced via `getStakingProviderMetadata`. */
    metadata?: StakingProviderMetadataOverride;
}

/**
 * Configuration for TonStakersStakingProvider — map of chain ID to per-chain {@link TonStakersChainConfig}.
 */
export type TonStakersProviderConfig = {
    [chainId: string]: TonStakersChainConfig;
};
