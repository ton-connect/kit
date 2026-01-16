/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network, TokenAmount, TransactionRequest, UserFriendlyAddress } from '../../api/models';

export enum StakingQuoteDirection {
    Stake = 'stake',
    Unstake = 'unstake',
}

export enum UnstakeMode {
    Instant = 'instant',
    Delayed = 'delayed',
}

/**
 * Parameters for requesting a staking quote
 */
export interface StakingQuoteParams {
    direction: StakingQuoteDirection;
    amount: TokenAmount;
    userAddress?: UserFriendlyAddress;
    network?: Network;
    unstakeMode?: UnstakeMode;
}

/**
 * Staking quote response with pricing information
 */
export interface StakingQuote {
    direction: StakingQuoteDirection;
    amountIn: TokenAmount;
    amountOut: TokenAmount;
    provider: string;
    apy?: number;
    unstakeMode?: UnstakeMode;
    estimatedUnstakeDelayHours?: number;
    instantUnstakeAvailable?: TokenAmount;
    metadata?: unknown;
}

/**
 * Parameters for building a market swap transaction for st-tokens
 */
export interface StakingMarketSwapParams {
    quote: StakingQuote;
    userAddress: UserFriendlyAddress;
}

/**
 * Parameters for staking TON
 */
export interface StakeParams {
    amount: TokenAmount;
    userAddress: UserFriendlyAddress;
    network?: Network;
}

/**
 * Parameters for unstaking TON
 */
export interface UnstakeParams {
    amount: TokenAmount;
    userAddress: UserFriendlyAddress;
    network?: Network;
    unstakeMode?: UnstakeMode;
    /**
     * Optional upper bound for delayed unstake waiting time.
     * Providers can use this to decide between instant and delayed flows.
     */
    maxDelayHours?: number;
}

/**
 * Staking balance information for a user
 */
export interface StakingBalance {
    stakedBalance: TokenAmount;
    availableBalance: TokenAmount;
    instantUnstakeAvailable: TokenAmount;
    provider: string;
}

/**
 * Staking information for a provider
 */
export interface StakingInfo {
    apy: number;
    instantUnstakeAvailable?: TokenAmount;
    provider: string;
}

/**
 * Staking API interface exposed by StakingManager
 */
export interface StakingAPI {
    getQuote(params: StakingQuoteParams, provider?: string): Promise<StakingQuote>;
    stake(params: StakeParams, provider?: string): Promise<TransactionRequest>;
    unstake(params: UnstakeParams, provider?: string): Promise<TransactionRequest>;
    getBalance(userAddress: UserFriendlyAddress, network?: Network, provider?: string): Promise<StakingBalance>;
    getStakingInfo(network?: Network, provider?: string): Promise<StakingInfo>;
}

/**
 * Interface that all staking providers must implement
 */
export interface StakingProviderInterface {
    getQuote(params: StakingQuoteParams): Promise<StakingQuote>;
    stake(params: StakeParams): Promise<TransactionRequest>;
    unstake(params: UnstakeParams): Promise<TransactionRequest>;
    getBalance(userAddress: UserFriendlyAddress, network?: Network): Promise<StakingBalance>;
    getStakingInfo(network?: Network): Promise<StakingInfo>;
}

/**
 * Optional interface for market providers that exchange st-tokens.
 * This should remain separate from staking provider logic.
 */
export interface StakingMarketProviderInterface {
    getQuote(params: StakingQuoteParams): Promise<StakingQuote>;
    buildSwapTransaction(params: StakingMarketSwapParams): Promise<TransactionRequest>;
}
