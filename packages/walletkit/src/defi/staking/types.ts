/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network, TransactionRequest, UserFriendlyAddress, TokenAmount } from '../../api/models';
import {StakingError} from "./errors";

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

export interface StakingAPI {
    getQuote(params: SwapQuoteParams, provider?: string): Promise<SwapQuote>;
    buildStakingTransaction(params: SwapParams, provider?: string): Promise<TransactionRequest>;
}

export interface StakingProviderInterface {
    getQuote(params: SwapQuoteParams): Promise<SwapQuote>;
    buildSwapTransaction(params: SwapParams): Promise<TransactionRequest>;
}

export interface StakeParams {
    amount: TokenAmount;
    userAddress: UserFriendlyAddress;
    network: Network;
}

export interface UnstakeParams {
    amount: TokenAmount;
    userAddress: UserFriendlyAddress;
    network: Network;
}

export interface StakingBalance {
    stakedBalance: TokenAmount;
    availableBalance: TokenAmount;
    instantUnstakeAvailable: TokenAmount;
    network: Network;
    provider: string;
}

export interface StakingInfo {
    apy: number;
    network: Network;
    provider: string;
}

export interface StakingAPI {
    registerProvider(name: string, provider: StakingProviderInterface): void;
    setDefaultProvider(name: string): void;
    getProvider(name?: string): StakingProviderInterface;
    stake(params: StakeParams, provider?: string): Promise<TransactionRequest>;
    unstake(params: UnstakeParams, provider?: string): Promise<TransactionRequest>;
    getBalance(userAddress: UserFriendlyAddress, network: Network, provider?: string): Promise<StakingBalance>;
    getStakingInfo(network: Network, provider?: string): Promise<StakingInfo>;
    getRegisteredProviders(): string[];
    hasProvider(name: string): boolean;
}

export interface StakingProviderInterface {
    stake(params: StakeParams): Promise<TransactionRequest>;
    unstake(params: UnstakeParams): Promise<TransactionRequest>;
    getBalance(userAddress: UserFriendlyAddress, network: Network): Promise<StakingBalance>;
    getStakingInfo(network: Network): Promise<StakingInfo>;
}
