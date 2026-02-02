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
    RoundInfo,
} from '../types';
import { StakingError, StakingErrorCode } from '../errors';
import { StakingQuoteDirection, UnstakeMode } from '../types';
import type { TonStakersProviderConfig } from './types';
import { CONTRACT, TIMING } from './constants';
import type { PoolFullData } from './PoolContract';
import { PoolContract } from './PoolContract';
import { StakingCache } from './StakingCache';

const log = globalLogger.createChild('TonStakersStakingProvider');

/**
 * TonStakersStakingProvider - Staking provider for the Tonstakers liquid staking protocol.
 *
 * This provider implements all staking operations using ONLY Toncenter API
 * (no TonAPI dependency). It supports:
 * - Stake: Deposit TON to receive tsTON liquid staking tokens
 * - Unstake: Burn tsTON to withdraw TON with 3 modes:
 *   - Delayed: Standard withdrawal at end of round (~18 hours)
 *   - Instant: Immediate withdrawal if liquidity available
 *   - BestRate: Wait for best exchange rate at round end
 *
 * @example
 * ```typescript
 * const stakingManager = new StakingManager();
 * const provider = new TonStakersStakingProvider(
 *     walletKit.getNetworkManager(),
 *     walletKit.getEventEmitter()
 * );
 * stakingManager.registerProvider('tonstakers', provider);
 *
 * // Get staking info with APY
 * const info = await stakingManager.getStakingInfo(Network.mainnet());
 *
 * // Stake TON
 * const stakeTx = await stakingManager.stake({
 *     amount: toNano('10').toString(),
 *     userAddress: wallet.getAddress(),
 *     network: Network.mainnet()
 * });
 *
 * // Unstake with instant mode
 * const unstakeTx = await stakingManager.unstake({
 *     amount: toNano('5').toString(),
 *     userAddress: wallet.getAddress(),
 *     network: Network.mainnet(),
 *     unstakeMode: UnstakeMode.Instant
 * });
 * ```
 */
export class TonStakersStakingProvider extends StakingProvider {
    protected config: TonStakersProviderConfig;
    private cache: StakingCache;

    /**
     * Create a new TonStakersStakingProvider instance.
     *
     * @param networkManager - Network manager for API client access
     * @param eventEmitter - Event emitter for staking events
     * @param config - Optional configuration with custom contract addresses per network
     */
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
        this.cache = new StakingCache();
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

    private getContract(network?: Network): PoolContract {
        const targetNetwork = network ?? Network.mainnet();
        const apiClient = this.getApiClient(targetNetwork);
        const contractAddress = this.getStakingContractAddress(targetNetwork);
        return new PoolContract(contractAddress, apiClient);
    }

    /**
     * Get a quote for staking or unstaking operations.
     *
     * @param params - Quote parameters including direction, amount, and optional unstake mode
     * @returns Quote with expected amounts and current APY (for stake direction)
     */
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

    /**
     * Build a transaction for staking TON.
     *
     * The stake operation sends TON to the Tonstakers pool contract
     * and receives tsTON liquid staking tokens in return.
     * A fee reserve of 1 TON is automatically added to the amount.
     *
     * @param params - Stake parameters including amount and user address
     * @returns Transaction request ready to be signed and sent
     */
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

    /**
     * Build a transaction for unstaking tsTON.
     *
     * Supports three unstake modes:
     * - **Delayed** (default): Standard withdrawal, funds released at end of round (~18 hours)
     * - **Instant**: Immediate withdrawal if pool has sufficient liquidity (fillOrKill)
     * - **BestRate**: Wait until round end for best exchange rate
     *
     * @param params - Unstake parameters including amount, user address, and optional mode
     * @returns Transaction request ready to be signed and sent
     */
    async unstake(params: UnstakeParams): Promise<TransactionRequest> {
        log.debug('TonStakers unstake requested', { amount: params.amount, userAddress: params.userAddress });

        const network = params.network;
        const amount = BigInt(params.amount);
        const unstakeMode = params.unstakeMode || UnstakeMode.Delayed;

        let waitTillRoundEnd = false;
        let fillOrKill = false;

        switch (unstakeMode) {
            case UnstakeMode.Instant:
                waitTillRoundEnd = false;
                fillOrKill = true;
                break;
            case UnstakeMode.BestRate:
                waitTillRoundEnd = true;
                fillOrKill = false;
                break;
            case UnstakeMode.Delayed:
            default:
                waitTillRoundEnd = false;
                fillOrKill = false;
                break;
        }

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

    /**
     * Get staking balance information for a user.
     *
     * Returns:
     * - stakedBalance: Amount of tsTON tokens held
     * - availableBalance: TON available for staking (minus fee reserve)
     * - instantUnstakeAvailable: Pool liquidity for instant unstaking
     *
     * @param userAddress - User wallet address
     * @param network - Network to query (defaults to mainnet)
     * @returns Balance information including staked and available amounts
     */
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

            let stakedBalance = '0';
            let instantUnstakeAvailable = 0n;

            const contract = this.getContract(targetNetwork);

            try {
                stakedBalance = await contract.getStakedBalance(userAddress);
            } catch (error) {
                log.warn('Failed to get staked balance', { error });
            }

            try {
                instantUnstakeAvailable = await contract.getPoolBalance();
            } catch (error) {
                log.warn('Failed to get instant unstake liquidity', { error });
            }

            return {
                stakedBalance: stakedBalance,
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

    /**
     * Get staking pool information including APY and liquidity.
     *
     * APY is calculated from on-chain data using the formula:
     * (interest_rate / 2^24) * cycles_per_year * (1 - protocol_fee)
     *
     * Results are cached for 30 seconds to reduce API calls.
     *
     * @param network - Network to query (defaults to mainnet)
     * @returns Staking info with APY and available instant liquidity
     */
    async getStakingInfo(network?: Network): Promise<StakingInfo> {
        log.debug('TonStakers info requested', { network });

        const targetNetwork = network ?? Network.mainnet();
        const cacheKey = `staking-info:${targetNetwork.chainId}`;

        try {
            return await this.cache.get(
                cacheKey,
                async () => {
                    const contract = this.getContract(targetNetwork);
                    const poolData = await contract.getPoolData();
                    const apy = contract.calculateApy(poolData.interestRatePercent);
                    const instantLiquidity = await contract.getPoolBalance();

                    return {
                        apy,
                        instantUnstakeAvailable: instantLiquidity.toString(),
                        provider: 'tonstakers',
                    };
                },
                TIMING.CACHE_TIMEOUT,
            );
        } catch (error) {
            log.warn('Failed to get staking info from on-chain', { error });
            return {
                apy: 0,
                instantUnstakeAvailable: '0',
                provider: 'tonstakers',
            };
        }
    }

    /**
     * Get full pool data from on-chain getter.
     * Results are cached for 30 seconds.
     *
     * @param network - Network to query (defaults to mainnet)
     * @returns Pool data including total_balance, supply, interest_rate
     */
    async getPoolFullData(network?: Network): Promise<PoolFullData> {
        const targetNetwork = network ?? Network.mainnet();
        const cacheKey = `pool-full-data:${targetNetwork.chainId}`;

        return this.cache.get(
            cacheKey,
            async () => {
                const contract = this.getContract(targetNetwork);
                return contract.getPoolFullData();
            },
            TIMING.CACHE_TIMEOUT,
        );
    }

    /**
     * Get current round timing information.
     * Note: Returns estimated values based on ~18 hour cycle length.
     *
     * @param network - Network to query (defaults to mainnet)
     * @returns Round info with cycle_start, cycle_end, and cycle_length
     */
    async getRoundInfo(network?: Network): Promise<RoundInfo> {
        const contract = this.getContract(network);
        return contract.getRoundInfo();
    }

    /**
     * Get instant unstake liquidity available in the pool.
     * This is the amount that can be withdrawn instantly.
     * Results are cached for 30 seconds.
     *
     * @param network - Network to query (defaults to mainnet)
     * @returns Available liquidity in nanotons
     */
    async getInstantLiquidity(network?: Network): Promise<bigint> {
        const targetNetwork = network ?? Network.mainnet();
        const cacheKey = `instant-liquidity:${targetNetwork.chainId}`;

        return this.cache.get(
            cacheKey,
            async () => {
                const contract = this.getContract(targetNetwork);
                return contract.getPoolBalance();
            },
            TIMING.CACHE_TIMEOUT,
        );
    }

    /**
     * Clear all cached data.
     * Use this to force fresh data retrieval on next call.
     */
    clearCache(): void {
        this.cache.clear();
    }
}
