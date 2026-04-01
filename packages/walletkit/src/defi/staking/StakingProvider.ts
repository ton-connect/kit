/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network, TransactionRequest, UserFriendlyAddress } from '../../api/models';
import type {
    StakeParams,
    StakingBalance,
    StakingProviderInfo,
    StakingQuoteParams,
    StakingQuote,
} from '../../api/models';
import type { StakingProviderInterface } from '../../api/interfaces';
import type { UnstakeModes } from '../../api/models/staking/UnstakeMode';

/**
 * Abstract base class for staking providers
 *
 * Provides common utilities and enforces implementation of core staking methods.
 * Users can extend this class to create custom staking providers.
 */
export abstract class StakingProvider implements StakingProviderInterface {
    readonly type = 'staking';
    readonly providerId: string;

    constructor(providerId: string) {
        this.providerId = providerId;
    }

    /**
     * Get a quote for staking or unstaking
     * @param params - Quote parameters including direction and amount
     */
    abstract getQuote(params: StakingQuoteParams): Promise<StakingQuote>;

    /**
     * Build a transaction for staking
     * @param params - Staking parameters including amount and user address
     * @returns Promise resolving to transaction request ready to be signed
     */
    abstract buildStakeTransaction(params: StakeParams): Promise<TransactionRequest>;

    /**
     * Get staked balance for a user
     * @param userAddress - User address to fetch balance for
     * @param network - Optional network to use for balance query
     */
    abstract getStakedBalance(userAddress: UserFriendlyAddress, network?: Network): Promise<StakingBalance>;

    /**
     * Get staking information for a network
     * @param network - Optional network to fetch info for
     */
    abstract getStakingProviderInfo(network?: Network): Promise<StakingProviderInfo>;

    /**
     * Get supported unstake modes
     * @returns An array of supported unstake modes
     */
    abstract getSupportedUnstakeModes(): UnstakeModes[];
}
