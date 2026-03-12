/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { DefiProvider } from '../../api/interfaces';
import type { Network, TokenAmount, TransactionRequest, UserFriendlyAddress } from '../../api/models';

export enum StakingQuoteDirection {
    Stake = 'stake',
    Unstake = 'unstake',
}

export enum UnstakeMode {
    Instant = 'instant',
    Delayed = 'delayed',
    BestRate = 'bestRate',
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
    providerId: string;
}

/**
 * Staking information for a provider
 */
export interface StakingProviderInfo {
    apy: number;
    instantUnstakeAvailable?: TokenAmount;
    providerId: string;
}

/**
 * Staking API interface exposed by StakingManager
 */
export interface StakingAPI {
    getQuote(params: StakingQuoteParams, providerId?: string): Promise<StakingQuote>;
    stake(params: StakeParams, providerId?: string): Promise<TransactionRequest>;
    unstake(params: UnstakeParams, providerId?: string): Promise<TransactionRequest>;
    getBalance(userAddress: UserFriendlyAddress, network?: Network, providerId?: string): Promise<StakingBalance>;
    getStakingProviderInfo(network?: Network, providerId?: string): Promise<StakingProviderInfo>;
}

/**
 * Interface that all staking providers must implement
 */
export interface StakingProviderInterface extends DefiProvider {
    getQuote(params: StakingQuoteParams): Promise<StakingQuote>;
    buildStakeTransaction(params: StakeParams): Promise<TransactionRequest>;
    buildUnstakeTransaction(params: UnstakeParams): Promise<TransactionRequest>;
    getStakedBalance(userAddress: UserFriendlyAddress, network?: Network): Promise<StakingBalance>;
    getStakingProviderInfo(network?: Network): Promise<StakingProviderInfo>;
}
