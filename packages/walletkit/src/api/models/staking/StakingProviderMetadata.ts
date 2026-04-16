/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UnstakeModes } from './UnstakeMode';

/**
 * Static metadata for a staking provider
 */
export interface StakingProviderMetadata {
    /**
     * Identifier of the staking provider
     */
    providerId: string;

    /**
     * Staking coin ticker
     */
    stakeCoinTicker: string;

    /**
     * Staking coin decimals
     * @format int
     */
    stakeCoinDecimals: number;

    /**
     * Liquid staking token ticker
     */
    lstTicker: string;

    /**
     * Liquid staking token decimals
     * @format int
     */
    lstDecimals: number;

    /**
     * Supported unstake modes for this provider
     */
    supportedUnstakeModes: UnstakeModes[];

    /**
     * Whether provider supports reversed quote format (e.g., passing TON instead of tsTON for unstake)
     */
    supportsReversedQuote: boolean;
}
