/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TransactionRequest, UserFriendlyAddress } from '../../../api/models';
import { Network } from '../../../api/models';
import { globalLogger } from '../../../core/Logger';
import type { NetworkManager } from '../../../core/NetworkManager';
import type { EventEmitter } from '../../../core/EventEmitter';
import { StakingProvider } from '../StakingProvider';
import type {
    StakeParams,
    UnstakeParams,
    StakingBalance,
    StakingInfo,
    StakingQuoteParams,
    StakingQuote,
} from '../types';
import { StakingError, StakingErrorCode } from '../errors';
import { StakingQuoteDirection, UnstakeMode } from '../types';
import type { TonStakersProviderConfig } from './types';
import { CONTRACT } from './constants';
import { TonStakersContract } from './TonStakersContract';

const log = globalLogger.createChild('TonStakersStakingProvider');

export class TonStakersStakingProvider extends StakingProvider {
    protected config: TonStakersProviderConfig;

    constructor(networkManager: NetworkManager, eventEmitter: EventEmitter, config: TonStakersProviderConfig = {}) {
        super(networkManager, eventEmitter);
        this.config = {
            [Network.mainnet().chainId]: {
                contractAddress: CONTRACT.STAKING_CONTRACT_ADDRESS,
            },
            [Network.testnet().chainId]: {
                contractAddress: CONTRACT.STAKING_CONTRACT_ADDRESS_TESTNET,
            },
            ...config,
        };
        log.info('TonStakersStakingProvider initialized');
    }

    private getStakingContractAddress(network?: Network): string {
        const targetNetwork = network ?? Network.mainnet();
        const networkConfig = this.config[targetNetwork.chainId];

        if (!networkConfig || !networkConfig.contractAddress) {
            throw new StakingError(
                'Staking contract address is not configured for the selected network',
                StakingErrorCode.InvalidParams,
                { network: targetNetwork },
            );
        }

        return networkConfig.contractAddress;
    }

    private getContract(network?: Network): TonStakersContract {
        const targetNetwork = network ?? Network.mainnet();
        const apiClient = this.getApiClient(targetNetwork);
        const contractAddress = this.getStakingContractAddress(targetNetwork);
        return new TonStakersContract(contractAddress, apiClient);
    }

    async getQuote(params: StakingQuoteParams): Promise<StakingQuote> {
        log.debug('TonStakers quote requested', {
            direction: params.direction,
            amount: params.amount,
            userAddress: params.userAddress,
        });

        const stakingInfo = await this.getStakingInfo(params.network);

        if (params.direction === StakingQuoteDirection.Stake) {
            return {
                direction: StakingQuoteDirection.Stake,
                amountIn: params.amount,
                amountOut: params.amount, // 1:1 for staking
                provider: 'tonstakers',
                apy: stakingInfo.apy,
            };
        } else {
            // For unstaking, amount is the same (1:1)
            return {
                direction: StakingQuoteDirection.Unstake,
                amountIn: params.amount,
                amountOut: params.amount,
                provider: 'tonstakers',
                unstakeMode: params.unstakeMode || UnstakeMode.Delayed,
            };
        }
    }

    async stake(params: StakeParams): Promise<TransactionRequest> {
        log.debug('TonStakers stake requested', { params });

        const network = params.network;
        const contractAddress = this.getStakingContractAddress(network);
        const amount = BigInt(params.amount);
        const totalAmount = amount + CONTRACT.STAKE_FEE_RES;

        const contract = this.getContract(network);
        const payload = contract.buildStakePayload(1n);

        const message = {
            address: contractAddress,
            amount: totalAmount.toString(),
            payload,
        };

        return {
            messages: [message],
            fromAddress: params.userAddress,
            network,
        };
    }

    async unstake(params: UnstakeParams): Promise<TransactionRequest> {
        log.debug('TonStakers unstake requested', { amount: params.amount, userAddress: params.userAddress });

        const network = params.network;
        const amount = BigInt(params.amount);
        const unstakeMode = params.unstakeMode || UnstakeMode.Delayed;
        const waitTillRoundEnd = unstakeMode === UnstakeMode.Delayed && params.maxDelayHours !== undefined;
        const fillOrKill = unstakeMode === UnstakeMode.Instant;

        const contract = this.getContract(network);
        const message = await contract.buildUnstakeMessage({
            amount,
            userAddress: params.userAddress,
            waitTillRoundEnd,
            fillOrKill,
        });

        return {
            messages: [message],
            fromAddress: params.userAddress,
            network,
        };
    }

    async getBalance(userAddress: UserFriendlyAddress, network?: Network): Promise<StakingBalance> {
        log.debug('TonStakers balance requested', { userAddress, network });

        try {
            const targetNetwork = network ?? Network.mainnet();
            const apiClient = this.getApiClient(targetNetwork);
            const tonBalance = await apiClient.getBalance(userAddress);
            const availableBalance =
                BigInt(tonBalance) > CONTRACT.RECOMMENDED_FEE_RESERVE
                    ? BigInt(tonBalance) - CONTRACT.RECOMMENDED_FEE_RESERVE
                    : 0n;

            // Get staked balance (tsTON)
            let stakedBalance = 0n;
            let instantUnstakeAvailable = 0n;

            try {
                const contract = this.getContract(network);
                stakedBalance = await contract.getStakedBalance(userAddress);
            } catch (error) {
                log.warn('Failed to get staked balance', { error });
            }

            return {
                stakedBalance: stakedBalance.toString(),
                availableBalance: availableBalance.toString(),
                instantUnstakeAvailable: instantUnstakeAvailable.toString(),
                provider: 'tonstakers',
            };
        } catch (error) {
            log.error('Failed to get balance', { error, userAddress, network });
            throw new StakingError('Failed to get staking balance', StakingErrorCode.InvalidParams, {
                error,
                userAddress,
                network,
            });
        }
    }

    async getStakingInfo(network?: Network): Promise<StakingInfo> {
        log.debug('TonStakers info requested', { network });

        // Note: APY and other dynamic info is not easily available on-chain without historical data.
        // We return default values here to avoid dependency on external APIs like tonapi.io
        return Promise.resolve({
            apy: 0,
            instantUnstakeAvailable: '0',
            provider: 'tonstakers',
        });
    }
}
