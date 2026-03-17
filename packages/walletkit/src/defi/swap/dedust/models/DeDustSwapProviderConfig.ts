/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { DeDustReferralOptions } from './DeDustReferralOptions';

/**
 * Configuration for the DeDust Swap Provider
 */
export interface DeDustSwapProviderConfig extends DeDustReferralOptions {
    /**
     * Custom provider ID (defaults to 'dedust')
     */
    providerId?: string;

    /**
     * Default slippage tolerance in basis points (1 bp = 0.01%)
     * @default 100 (1%)
     * @format int
     */
    defaultSlippageBps?: number;

    /**
     * API base URL
     * @default 'https://api-mainnet.dedust.io'
     * @format url
     */
    apiUrl?: string;

    /**
     * Only use verified pools
     * @default true
     */
    onlyVerifiedPools?: boolean;

    /**
     * Maximum number of route splits
     * @default 4
     * @format int
     */
    maxSplits?: number;

    /**
     * Maximum route length (hops)
     * @default 3
     * @format int
     */
    maxLength?: number;

    /**
     * Minimum pool TVL in USD
     * @default '5000'
     */
    minPoolUsdTvl?: string;
}
