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
    StakingQuote,
    StakingQuoteParams,
    UnstakeParams,
    TransactionRequest,
    UserFriendlyAddress,
} from '../models';

/**
 * Staking API interface exposed by StakingManager
 */
export interface StakingAPI extends DefiManagerAPI<StakingProviderInterface> {
    getQuote(params: StakingQuoteParams, providerId?: string): Promise<StakingQuote>;
    buildStakeTransaction(params: StakeParams, providerId?: string): Promise<TransactionRequest>;
    buildUnstakeTransaction(params: UnstakeParams, providerId?: string): Promise<TransactionRequest>;
    getStakedBalance(userAddress: UserFriendlyAddress, network?: Network, providerId?: string): Promise<StakingBalance>;
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
