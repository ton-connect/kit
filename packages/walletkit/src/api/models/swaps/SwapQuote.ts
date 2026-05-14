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
 * Swap quote response with pricing information.
 */
export interface SwapQuote {
    /**
     * Token being sold.
     */
    fromToken: SwapToken;

    /**
     * Token being bought.
     */
    toToken: SwapToken;

    /**
     * Amount of `fromToken` to sell, in raw smallest units (e.g., nano-TON).
     */
    rawFromAmount: TokenAmount;

    /**
     * Amount of `toToken` to buy, in raw smallest units (e.g., nano-TON).
     */
    rawToAmount: TokenAmount;

    /**
     * Amount of `fromToken` to sell, formatted to the token's decimals as a human-readable decimal string (e.g., `"1.5"`).
     */
    fromAmount: string;

    /**
     * Amount of `toToken` to buy, formatted to the token's decimals as a human-readable decimal string (e.g., `"1.5"`).
     */
    toAmount: string;

    /**
     * Minimum amount of `toToken` to receive after slippage, in raw smallest units (e.g., nano-TON).
     */
    rawMinReceived: TokenAmount;

    /**
     * Minimum amount of `toToken` to receive after slippage, formatted to the token's decimals as a human-readable decimal string (e.g., `"1.5"`).
     */
    minReceived: string;

    /**
     * Network on which the swap will be executed.
     */
    network: Network;

    /**
     * Price impact of the swap in basis points (100 = 1%)
     * @format int
     */
    priceImpact?: number;

    /**
     * Identifier of the swap provider.
     */
    providerId: string;

    /**
     * Unix timestamp in seconds when the quote expires
     * @format int
     */
    expiresAt?: number;

    /**
     * Provider-specific metadata for the quote.
     */
    metadata?: unknown;
}
