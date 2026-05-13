/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress } from '../core/Primitives';
import type { Network } from '../core/Network';
import type { StakingQuoteDirection } from './StakingQuoteDirection';
import type { UnstakeModes } from './UnstakeMode';

/**
 * Parameters for getting a staking quote
 */
export interface StakingQuoteParams<TProviderOptions = unknown> {
    /**
     * Direction of the quote (stake or unstake)
     */
    direction: StakingQuoteDirection;

    /**
     * Amount of tokens to stake or unstake
     */
    amount: string;

    /**
     * Address of the user
     */
    userAddress?: UserFriendlyAddress;

    /**
     * Network on which the staking will be executed
     */
    network?: Network;

    /**
     * Unstake-timing mode the quote should target — see {@link UnstakeMode} for the supported flavours (`'INSTANT'`, `'WHEN_AVAILABLE'`, `'ROUND_END'`). Only meaningful when `direction === 'unstake'` and the provider lists the mode in `supportedUnstakeModes`.
     */
    unstakeMode?: UnstakeModes;

    /**
     * If true, for unstake requests the amount is specified in the staking coin (e.g. TON)
     * instead of the Liquid Staking Token (e.g. tsTON).
     */
    isReversed?: boolean;

    /**
     * Provider-specific options
     */
    providerOptions?: TProviderOptions;
}
