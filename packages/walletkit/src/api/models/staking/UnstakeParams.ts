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
 * Parameters for unstaking TON
 */
export interface UnstakeParams<TProviderOptions = unknown> {
    /**
     * The staking quote based on which the transaction is built
     */
    quote: StakingQuote;

    /**
     * Address of the user performing the unstaking
     */
    userAddress: UserFriendlyAddress;

    /**
     * Optional upper bound for delayed unstake waiting time.
     * Providers can use this to decide between instant and delayed flows.
     * @format int
     */
    maxDelayHours?: number;

    /**
     * Provider-specific options
     */
    providerOptions?: TProviderOptions;
}
