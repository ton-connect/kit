/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '../core/Network';
import type { TokenAmount } from '../core/TokenAmount';
import type { SwapFee } from './SwapFee';
import type { SwapToken } from './SwapToken';

/**
 * Swap quote response with pricing information
 */
export interface SwapQuote {
    /**
     * Token being sold
     */
    fromToken: SwapToken;

    /**
     * Token being bought
     */
    toToken: SwapToken;

    /**
     * Amount of tokens to sell
     */
    rawFromAmount: TokenAmount;

    /**
     * Amount of tokens to buy
     */
    rawToAmount: TokenAmount;

    /**
     * Amount of tokens to sell
     */
    fromAmount: TokenAmount;

    /**
     * Amount of tokens to buy
     */
    toAmount: TokenAmount;

    /**
     * Minimum amount of tokens to receive (after slippage)
     */
    rawMinReceived: TokenAmount;

    /**
     * Minimum amount of tokens to receive (after slippage)
     */
    minReceived: TokenAmount;

    /**
     * Network on which the swap will be executed
     */
    network: Network;

    /**
     * Price impact of the swap in basis points (100 = 1%)
     * @format int
     */
    priceImpact?: number;

    /**
     * Fees associated with the swap
     */
    fee?: SwapFee[];

    /**
     * Identifier of the swap provider
     */
    providerId: string;

    /**
     * Unix timestamp in seconds when the quote expires
     * @format int
     */
    expiresAt?: number;

    /**
     * Provider-specific metadata for the quote
     */
    metadata?: unknown;
}
