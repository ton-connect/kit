/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress } from '../core/Primitives';
import type { UnstakeModes } from './UnstakeMode';

/**
 * Static metadata for a staking provider
 */
export interface StakingProviderMetadata {
    /**
     * Staking token ticker
     */
    stakeTokenTicker: string;

    /**
     * Staking token decimals
     * @format int
     */
    stakeTokenDecimals: number;

    /**
     * Staking token address ('ton' if native, otherwise contract address in friendly format)
     */
    stakeTokenAddress: string;

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
     * Liquid staking token address
     */
    lstAddress: UserFriendlyAddress;

    /**
     * Provider contract address
     */
    contractAddress: UserFriendlyAddress;

    /**
     * Supported unstake modes for this provider
     */
    supportedUnstakeModes: UnstakeModes[];

    /**
     * Whether provider supports reversed quote format (e.g., passing TON instead of tsTON for unstake)
     */
    supportsReversedQuote: boolean;
}
