/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address, beginCell } from '@ton/core';

import type {
    TransactionRequest,
    UserFriendlyAddress,
    TransactionRequestMessage,
    Base64String,
} from '../../../api/models';
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
import { ParseStack } from '../../../utils';

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

        const payload = beginCell()
            .storeUint(CONTRACT.PAYLOAD_STAKE, 32)
            .storeUint(1, 64)
            .storeUint(CONTRACT.PARTNER_CODE, 64)
            .endCell()
            .toBoc()
            .toString('base64');

        const message: TransactionRequestMessage = {
            address: contractAddress,
            amount: totalAmount.toString(),
            payload: payload as Base64String,
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

        // Get jetton wallet address
        const jettonWalletAddress = await this.getJettonWalletAddress(params.userAddress, network);

        const payload = beginCell()
            .storeUint(CONTRACT.PAYLOAD_UNSTAKE, 32)
            .storeUint(0, 64)
            .storeCoins(amount)
            .storeAddress(Address.parse(params.userAddress))
            .storeMaybeRef(
                beginCell()
                    .storeUint(waitTillRoundEnd ? 1 : 0, 1)
                    .storeUint(fillOrKill ? 1 : 0, 1)
                    .endCell(),
            )
            .endCell()
            .toBoc()
            .toString('base64');

        const message: TransactionRequestMessage = {
            address: jettonWalletAddress,
            amount: CONTRACT.UNSTAKE_FEE_RES.toString(),
            payload: payload as Base64String,
        };

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
                const jettonWalletAddress = await this.getJettonWalletAddress(userAddress, network);
                const result = await apiClient.runGetMethod(jettonWalletAddress, 'get_wallet_data');

                // Parse balance from stack (first item is balance)
                if (result.stack && result.stack.length > 0) {
                    const parsedStack = ParseStack(result.stack);
                    if (parsedStack.length > 0 && parsedStack[0].type === 'int') {
                        stakedBalance = parsedStack[0].value;
                    }
                }
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

    private async getJettonWalletAddress(
        userAddress: UserFriendlyAddress,
        network?: Network,
    ): Promise<UserFriendlyAddress> {
        try {
            const targetNetwork = network ?? Network.mainnet();
            const contractAddress = this.getStakingContractAddress(targetNetwork);
            const apiClient = this.getApiClient(targetNetwork);

            // 1. Get pool info (get_pool_full_data) to find jetton minter
            // runGetMethod is used instead of fetch to avoid external API dependencies
            const poolInfoResult = await apiClient.runGetMethod(contractAddress, 'get_pool_full_data');

            let jettonMinterAddress: string | undefined;

            if (poolInfoResult.stack && poolInfoResult.stack.length > 0) {
                const parsedStack = ParseStack(poolInfoResult.stack);
                // Look for an address in the stack which is likely the jetton minter
                // Based on observation, it is usually one of the addresses in the stack
                for (const item of parsedStack) {
                    if (item.type === 'cell') {
                        try {
                            const slice = item.cell.beginParse();
                            const addr = slice.loadAddress();
                            // Basic check if it looks like a valid address (not null address)
                            if (
                                addr &&
                                addr.hash &&
                                addr.hash.length > 0 &&
                                !addr.equals(Address.parse(contractAddress))
                            ) {
                                jettonMinterAddress = addr.toString();
                                break; // Take the first valid address found
                            }
                        } catch {
                            // Ignore parse errors
                        }
                    }
                }
            }

            if (!jettonMinterAddress) {
                throw new Error('Jetton minter address not found in pool data');
            }

            // 2. Get jetton wallet address using API client via get_wallet_address method on minter
            const addressCell = beginCell()
                .storeAddress(Address.parse(userAddress))
                .endCell()
                .toBoc()
                .toString('base64');

            const result = await apiClient.runGetMethod(jettonMinterAddress, 'get_wallet_address', [
                { type: 'cell', value: addressCell },
            ]);

            // Parse result from stack
            if (result.stack && result.stack.length > 0) {
                const parsedStack = ParseStack(result.stack);
                if (parsedStack.length > 0 && parsedStack[0].type === 'cell') {
                    // Extract address from cell
                    const addressSlice = parsedStack[0].cell.beginParse();
                    const address = addressSlice.loadAddress();
                    return address.toString() as UserFriendlyAddress;
                }
            }

            throw new Error('Failed to get jetton wallet address from minter');
        } catch (error) {
            log.error('Failed to get jetton wallet address', { error, userAddress, network });
            throw new StakingError('Failed to get jetton wallet address', StakingErrorCode.InvalidParams, {
                error,
                userAddress,
                network,
            });
        }
    }
}
