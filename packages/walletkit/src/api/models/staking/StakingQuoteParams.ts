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
     * Requested mode of unstaking
     */
    unstakeMode?: UnstakeModes;

    /**
     * Provider-specific options
     */
    providerOptions?: TProviderOptions;
}
