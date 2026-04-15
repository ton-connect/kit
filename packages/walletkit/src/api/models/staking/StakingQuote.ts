/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '../core/Network';
import type { TokenAmount } from '../core/TokenAmount';
import type { StakingQuoteDirection } from './StakingQuoteDirection';
import type { UnstakeModes } from './UnstakeMode';

/**
 * Staking quote response with pricing information
 */
export interface StakingQuote {
    /**
     * Direction of the quote (stake or unstake)
     */
    direction: StakingQuoteDirection;

    /**
     * Amount of tokens being provided
     */
    rawAmountIn: TokenAmount;

    /**
     * Estimated amount of tokens to be received
     */
    rawAmountOut: TokenAmount;

    /**
     * Formatted amount of tokens being provided
     */
    amountIn: string;

    /**
     * Formatted estimated amount of tokens to be received
     */
    amountOut: string;

    /**
     * Network on which the staking will be executed
     */
    network: Network;

    /**
     * Identifier of the staking provider
     */
    providerId: string;

    /**
     * Annual Percentage Yield in basis points (100 = 1%)
     */
    apy?: number;

    /**
     * Mode of unstaking (if applicable)
     */
    unstakeMode?: UnstakeModes;

    /**
     * Provider-specific metadata for the quote
     */
    metadata?: unknown;
}
