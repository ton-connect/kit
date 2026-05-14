/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { DefiManagerAPI } from './DefiManagerAPI';
import type { DefiProvider } from './DefiProvider';
import type {
    Network,
    StakeParams,
    StakingBalance,
    StakingProviderInfo,
    StakingProviderMetadata,
    StakingQuote,
    StakingQuoteParams,
    TransactionRequest,
    UserFriendlyAddress,
} from '../models';

/**
 * Staking API interface exposed by StakingManager
 */
export interface StakingAPI extends DefiManagerAPI<StakingProviderInterface> {
    /**
     * Get a quote for staking or unstaking
     * @param params Quote parameters (amount, direction, etc.)
     * @param providerId Provider identifier (optional, uses default if not specified)
     * @returns A promise that resolves to a StakingQuote
     */
    getQuote(params: StakingQuoteParams, providerId?: string): Promise<StakingQuote>;

    /**
     * Build a transaction for staking
     * @param params Staking parameters (quote, user address, etc.)
     * @param providerId Provider identifier (optional, uses default if not specified)
     * @returns A promise that resolves to a TransactionRequest
     */
    buildStakeTransaction(params: StakeParams, providerId?: string): Promise<TransactionRequest>;

    /**
     * Get user's staked balance
     * @param userAddress User address
     * @param network Network to query (optional)
     * @param providerId Provider identifier (optional, uses default if not specified)
     * @returns A promise that resolves to a StakingBalance
     */
    getStakedBalance(userAddress: UserFriendlyAddress, network?: Network, providerId?: string): Promise<StakingBalance>;

    /**
     * Get staking provider information
     * @param network Network to query (optional)
     * @param providerId Provider identifier (optional, uses default if not specified)
     * @returns A promise that resolves to a StakingProviderInfo
     */
    getStakingProviderInfo(network?: Network, providerId?: string): Promise<StakingProviderInfo>;

    /**
     * Get static metadata for a staking provider
     * @param network Network to query (optional)
     * @param providerId Provider identifier (optional, uses default if not specified)
     * @returns Synchronous Provider Metadata
     */
    getStakingProviderMetadata(network?: Network, providerId?: string): StakingProviderMetadata;
}

/**
 * Interface that all staking providers must implement
 */
export interface StakingProviderInterface extends DefiProvider {
    readonly type: 'staking';

    /**
     * Unique identifier for the provider
     */
    readonly providerId: string;

    /**
     * Get a quote for staking or unstaking
     * @param params Quote parameters including provider-specific options
     * @returns A promise that resolves to a StakingQuote
     */
    getQuote(params: StakingQuoteParams): Promise<StakingQuote>;

    /**
     * Build a transaction for staking
     * @param params Staking parameters including provider-specific options
     * @returns A promise that resolves to a TransactionRequest
     */
    buildStakeTransaction(params: StakeParams): Promise<TransactionRequest>;

    /**
     * Get user's staked balance
     * @param userAddress User address
     * @param network Network to query (optional)
     * @returns A promise that resolves to a StakingBalance
     */
    getStakedBalance(userAddress: UserFriendlyAddress, network?: Network): Promise<StakingBalance>;

    /**
     * Get staking provider information
     * @param network Network to query (optional)
     * @returns A promise that resolves to a StakingProviderInfo
     */
    getStakingProviderInfo(network?: Network): Promise<StakingProviderInfo>;

    /**
     * Get static metadata for this staking provider
     * @param network Network to query (optional)
     * @returns Synchronous Provider Metadata
     */
    getStakingProviderMetadata(network?: Network): StakingProviderMetadata;
}
