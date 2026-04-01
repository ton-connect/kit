/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TransactionRequest, UserFriendlyAddress, Network } from '../../api/models';
import type {
    StakeParams,
    StakingBalance,
    StakingProviderInfo,
    StakingQuoteParams,
    StakingQuote,
} from '../../api/models';
import type { StakingAPI, StakingProviderInterface } from '../../api/interfaces';
import { StakingError, StakingErrorCode } from './errors';
import { globalLogger } from '../../core/Logger';
import { DefiManager } from '../DefiManager';
import type { ProviderFactoryContext } from '../../types/factory';
import type { UnstakeModes } from '../../api/models/staking/UnstakeMode';

const log = globalLogger.createChild('StakingManager');

/**
 * StakingManager - manages staking providers and delegates staking operations
 *
 * Allows registration of multiple staking providers and provides a unified API
 * for staking operations. Providers can be switched dynamically.
 */
export class StakingManager extends DefiManager<StakingProviderInterface> implements StakingAPI {
    constructor(createFactoryContext: () => ProviderFactoryContext) {
        super(createFactoryContext);
    }

    /**
     * Get a quote for staking or unstaking
     * @param params - Quote parameters
     * @param providerId - Optional provider id to use
     */
    async getQuote(params: StakingQuoteParams, providerId?: string): Promise<StakingQuote> {
        log.debug('Getting staking quote', params);
        try {
            const quote = await this.getProvider(providerId).getQuote(params);
            log.debug('Received staking quote', quote);
            return quote;
        } catch (error) {
            throw this.createError('Failed to get staking quote', StakingErrorCode.InvalidParams, { error, params });
        }
    }

    /**
     * Stake TON using a provider
     * @param params - Staking parameters
     * @param providerId - Optional provider id to use
     */
    async buildStakeTransaction(params: StakeParams, providerId?: string): Promise<TransactionRequest> {
        log.debug('Building staking transaction', params);
        try {
            return await this.getProvider(providerId).buildStakeTransaction(params);
        } catch (error) {
            throw this.createError('Failed to build staking transaction', StakingErrorCode.InvalidParams, {
                error,
                params,
            });
        }
    }

    /**
     * Get staking balance for a user
     * @param userAddress - User address
     * @param network - Network to query
     * @param providerId - Optional provider id to use
     */
    async getStakedBalance(
        userAddress: UserFriendlyAddress,
        network?: Network,
        providerId?: string,
    ): Promise<StakingBalance> {
        log.debug('Getting staking balance', {
            userAddress,
            network,
            provider: providerId || this.defaultProviderId,
        });

        try {
            return await this.getProvider(providerId).getStakedBalance(userAddress, network);
        } catch (error) {
            throw this.createError('Failed to get staking balance', StakingErrorCode.InvalidParams, {
                error,
                userAddress,
                network,
            });
        }
    }

    /**
     * Get staking information for a network
     * @param network - Network to query
     * @param providerId - Optional provider id to use
     */
    async getStakingProviderInfo(network?: Network, providerId?: string): Promise<StakingProviderInfo> {
        log.debug('Getting staking info', {
            network,
            provider: providerId || this.defaultProviderId,
        });

        try {
            return await this.getProvider(providerId).getStakingProviderInfo(network);
        } catch (error) {
            throw this.createError('Failed to get staking info', StakingErrorCode.InvalidParams, { error, network });
        }
    }

    /**
     * Get supported unstake modes
     * @param providerId Provider identifier (optional, uses default if not specified)
     * @returns An array of supported unstake modes
     */
    getSupportedUnstakeModes(providerId?: string): UnstakeModes[] {
        return this.getProvider(providerId).getSupportedUnstakeModes();
    }

    protected createError(message: string, code: string, details?: unknown): StakingError {
        const errorCode = Object.values(StakingErrorCode).includes(code as StakingErrorCode)
            ? (code as StakingErrorCode)
            : StakingErrorCode.InvalidParams;
        log.error(message, { code, details });
        return new StakingError(message, errorCode, details);
    }
}
