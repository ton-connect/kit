/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { DefiManagerAPI } from '../types';
import type { Network, TransactionRequest, UserFriendlyAddress } from '../../api/models';

/**
 * Base parameters for requesting a swap quote
 */
interface SwapQuoteParamsBase<TProviderOptions = unknown> {
    fromToken: UserFriendlyAddress | 'TON';
    toToken: UserFriendlyAddress | 'TON';
    network: Network;
    slippageBps?: number;
    maxOutgoingMessages?: number;
    providerOptions?: TProviderOptions;
}

/**
 * Parameters for requesting a swap quote with specified input amount
 */
export interface SwapQuoteParamsWithAmountFrom<
    TProviderOptions = unknown,
> extends SwapQuoteParamsBase<TProviderOptions> {
    amountFrom: string;
    amountTo?: never;
}

/**
 * Parameters for requesting a swap quote with specified output amount
 */
export interface SwapQuoteParamsWithAmountTo<TProviderOptions = unknown> extends SwapQuoteParamsBase<TProviderOptions> {
    amountFrom?: never;
    amountTo: string;
}

/**
 * Parameters for requesting a swap quote
 * Can specify either amountFrom (how much to swap) or amountTo (how much to receive)
 */
export type SwapQuoteParams<TProviderOptions = unknown> =
    | SwapQuoteParamsWithAmountFrom<TProviderOptions>
    | SwapQuoteParamsWithAmountTo<TProviderOptions>;

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
export interface SwapParams<TProviderOptions = unknown> {
    quote: SwapQuote;
    userAddress: UserFriendlyAddress;
    destinationAddress?: UserFriendlyAddress;
    slippageBps?: number;
    deadline?: number;
    providerOptions?: TProviderOptions;
}

/**
 * Swap API interface exposed by SwapManager
 */
export interface SwapAPI extends DefiManagerAPI<SwapProviderInterface> {
    getQuote(params: SwapQuoteParams, provider?: string): Promise<SwapQuote>;
    buildSwapTransaction(params: SwapParams, provider?: string): Promise<TransactionRequest>;
}

/**
 * Interface that all swap providers must implement
 */
export interface SwapProviderInterface<TQuoteOptions = unknown, TSwapOptions = unknown> {
    getQuote(params: SwapQuoteParams<TQuoteOptions>): Promise<SwapQuote>;
    buildSwapTransaction(params: SwapParams<TSwapOptions>): Promise<TransactionRequest>;
}
