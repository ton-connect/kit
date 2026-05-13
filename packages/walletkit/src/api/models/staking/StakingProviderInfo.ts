/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TokenAmount } from '../core/TokenAmount';

/**
 * Dynamic staking information for a provider
 */
export interface StakingProviderInfo {
    /**
     * Annual Percentage Yield in basis points (100 = 1%)
     */
    apy: number;

    /**
     * Amount available for instant unstake right now, in raw smallest units of the stake token (e.g., nano-TON).
     */
    rawInstantUnstakeAvailable?: TokenAmount;

    /**
     * Amount available for instant unstake right now, formatted to the stake token's decimals as a human-readable decimal string (e.g., `"12.5"`).
     */
    instantUnstakeAvailable?: string;

    /**
     * Exchange rate between stakeToken and receiveToken (e.g. 1 TON = 0.95 tsTON).
     * Undefined when there is no receiveToken (direct/custodial staking).
     */
    exchangeRate?: string;
}
