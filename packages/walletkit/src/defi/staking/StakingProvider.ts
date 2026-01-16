/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ApiClient } from '../../types/toncenter/ApiClient';
import type { Network, TransactionRequest, UserFriendlyAddress } from '../../api/models';
import type { NetworkManager } from '../../core/NetworkManager';
import type { EventEmitter } from '../../core/EventEmitter';
import type {
    StakeParams,
    UnstakeParams,
    StakingBalance,
    StakingInfo,
    StakingProviderInterface,
    StakingQuoteParams,
    StakingQuote,
} from './types';

/**
 * Abstract base class for staking providers
 *
 * Provides common utilities and enforces implementation of core staking methods.
 * Users can extend this class to create custom staking providers.
 */
export abstract class StakingProvider implements StakingProviderInterface {
    protected networkManager: NetworkManager;
    protected eventEmitter: EventEmitter;

    constructor(networkManager: NetworkManager, eventEmitter: EventEmitter) {
        this.networkManager = networkManager;
        this.eventEmitter = eventEmitter;
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
    abstract stake(params: StakeParams): Promise<TransactionRequest>;

    /**
     * Build a transaction for unstaking
     * @param params - Unstaking parameters including amount and user address
     * @returns Promise resolving to transaction request ready to be signed
     */
    abstract unstake(params: UnstakeParams): Promise<TransactionRequest>;

    /**
     * Get staking balance for a user
     * @param userAddress - User address to fetch balance for
     * @param network - Optional network to use for balance query
     */
    abstract getBalance(userAddress: UserFriendlyAddress, network?: Network): Promise<StakingBalance>;

    /**
     * Get staking information for a network
     * @param network - Optional network to fetch info for
     */
    abstract getStakingInfo(network?: Network): Promise<StakingInfo>;

    /**
     * Get API client for a specific network
     * @param network - The network to get client for
     * @returns API client instance
     */
    protected getApiClient(network: Network): ApiClient {
        return this.networkManager.getClient(network);
    }

    /**
     * Emit an event through the event emitter
     * @param event - Event name
     * @param data - Event data
     */
    protected emitEvent(event: string, data: unknown): void {
        this.eventEmitter.emit(event, data);
    }
}
