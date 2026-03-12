/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface TonStakersProviderConfig {
    [chainId: string]: {
        contractAddress: string;
        /**
         * Optional TonAPI token used exclusively for fetching historical APY.
         * The provider is fully functional without this token.
         */
        tonApiToken?: string;
    };
}
