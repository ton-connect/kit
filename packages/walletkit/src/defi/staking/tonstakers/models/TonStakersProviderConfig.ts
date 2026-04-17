/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StakingProviderMetadata } from '../../../../api/models';

export type TonStakersChainConfig = {
    tonApiToken?: string;
    metadata?: Partial<StakingProviderMetadata>;
};

/**
 * - **tonApiToken** – optional TonAPI key for APY requests only. If not provided, APY will be available, but if you're using TonAPI, it's recommended to provide the key.
 * - **metadata** – optional StakingProviderMetadata partial override to customize provider metadata.
 */
export interface TonStakersProviderConfig {
    [chainId: string]: TonStakersChainConfig;
}
