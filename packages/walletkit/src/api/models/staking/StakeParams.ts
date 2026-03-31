/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress } from '../core/Primitives';
import type { StakingQuote } from './StakingQuote';

/**
 * Parameters for staking TON
 */
export interface StakeParams<TProviderOptions = unknown> {
    /**
     * The staking quote based on which the transaction is built
     */
    quote: StakingQuote;

    /**
     * Address of the user performing the staking
     */
    userAddress: UserFriendlyAddress;

    /**
     * Provider-specific options
     */
    providerOptions?: TProviderOptions;
}
