/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network, TransactionRequest, UserFriendlyAddress } from '../../api/models';

/**
 * Parameters for requesting a swap quote
 */
export interface SwapQuoteParams {
    fromToken: UserFriendlyAddress | 'TON';
    toToken: UserFriendlyAddress | 'TON';
    amount: string;
    network: Network;
    slippageBps?: number;
}

/**
 * Swap quote response with pricing information
 */
export interface SwapQuote {
    fromToken: UserFriendlyAddress | 'TON';
    toToken: UserFriendlyAddress | 'TON';
    fromAmount: string;
    toAmount: string;
    minReceived: string;
    network: Network;
    priceImpact?: number;
    fee?: SwapFee[];
    provider: string;
    expiresAt?: number; // Unix timestamp in seconds
    metadata?: unknown;
}

/**
 * Fee information for swap
 */
export interface SwapFee {
    amount: string;
    token: UserFriendlyAddress | 'TON';
}

/**
 * Parameters for building swap transaction
 */
export interface SwapParams {
    quote: SwapQuote;
    userAddress: UserFriendlyAddress;
    slippageBps?: number;
    deadline?: number;
    referralAddress?: UserFriendlyAddress;
}

/**
 * Swap API interface exposed by SwapManager
 */
export interface SwapAPI {
    getQuote(params: SwapQuoteParams, provider?: string): Promise<SwapQuote>;
    buildSwapTransaction(params: SwapParams, provider?: string): Promise<TransactionRequest>;
}

/**
 * Interface that all swap providers must implement
 */
export interface SwapProviderInterface {
    getQuote(params: SwapQuoteParams): Promise<SwapQuote>;
    buildSwapTransaction(params: SwapParams): Promise<TransactionRequest>;
}
