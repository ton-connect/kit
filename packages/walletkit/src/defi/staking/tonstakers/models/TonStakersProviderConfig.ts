/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress } from '../../../../api/models';

export type TonStakersChainConfig = {
    contractAddress?: UserFriendlyAddress;
    tonApiToken?: string;
};

/**
 * - **contractAddress** – optional; defaults to the known pool for mainnet/testnet when present on the manager.
 * - **tonApiToken** – optional TonAPI key for APY requests only. If not provided, APY will be available, but if you're using TonAPI, it's recommended to provide the key.
 */
export interface TonStakersProviderConfig {
    [chainId: string]: TonStakersChainConfig;
}
