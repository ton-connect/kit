/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '../core/Network';
import type { TokenAmount } from '../core/TokenAmount';
import type { SwapToken } from './SwapToken';

/**
 * Base parameters for requesting a swap quote
 */
export interface SwapQuoteParams<TProviderOptions = unknown> {
    /**
     * Amount of tokens to swap (incoming or outgoing depending on isReverseSwap)
     */
    amount: TokenAmount;

    /**
     * Token to swap from
     */
    from: SwapToken;

    /**
     * Token to swap to
     */
    to: SwapToken;

    /**
     * Network on which the swap will be executed
     */
    network: Network;

    /**
     * Slippage tolerance in basis points (1 bp = 0.01%)
     * @format int
     */
    slippageBps?: number;

    /**
     * Maximum number of outgoing messages
     * @format int
     */
    maxOutgoingMessages?: number;

    /**
     * Provider-specific options
     */
    providerOptions?: TProviderOptions;

    /**
     * If true, amount is the amount to receive (buy). If false, amount is the amount to spend (sell).
     */
    isReverseSwap?: boolean;
}
