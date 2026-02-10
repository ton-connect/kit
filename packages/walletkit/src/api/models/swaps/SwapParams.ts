/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress } from '../core/Primitives';
import type { SwapQuote } from './SwapQuote';

/**
 * Parameters for building swap transaction
 */
export interface SwapParams<TProviderOptions = unknown> {
    /**
     * The swap quote based on which the transaction is built
     */
    quote: SwapQuote;

    /**
     * Address of the user performing the swap
     */
    userAddress: UserFriendlyAddress;

    /**
     * Address to receive the swapped tokens (defaults to userAddress)
     */
    destinationAddress?: UserFriendlyAddress;

    /**
     * Slippage tolerance in basis points (1 bp = 0.01%)
     * @format int
     */
    slippageBps?: number;

    /**
     * Transaction deadline in unix timestamp
     * @format int
     */
    deadline?: number;

    /**
     * Provider-specific options
     */
    providerOptions?: TProviderOptions;
}
