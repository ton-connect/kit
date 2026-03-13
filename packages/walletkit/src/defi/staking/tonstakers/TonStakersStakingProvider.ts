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
import { StakingProvider } from '../StakingProvider';
import type {
    StakeParams,
    UnstakeParams,
    StakingBalance,
    StakingProviderInfo,
    StakingQuoteParams,
    StakingQuote,
} from '../../../api/models';
import { StakingError, StakingErrorCode } from '../errors';
import type { TonStakersProviderConfig } from './models/TonStakersProviderConfig';
import { CONTRACT, STAKING_CONTRACT_ADDRESS } from './constants';
import { PoolContract } from './PoolContract';
import { StakingCache } from './StakingCache';
import { ApiClientTonApi } from '../../../clients/tonapi/ApiClientTonApi';
import { formatUnits, parseUnits } from '../../../utils/units';
import type { ApiClient } from '../../../types/toncenter/ApiClient';

const log = globalLogger.createChild('TonStakersStakingProvider');

/**
 * TonStakersStakingProvider - Staking provider for the Tonstakers liquid staking protocol.
 *
 * This provider implements all staking operations. It supports:
 * - Stake: Deposit TON to receive tsTON liquid staking tokens
 * - Unstake: Burn tsTON to withdraw TON with 3 modes:
 *   - Delayed: Standard withdrawal at end of round (~18 hours)
 *   - Instant: Immediate withdrawal if liquidity available
 *   - BestRate: Wait for best exchange rate at round end
 */
export class TonStakersStakingProvider extends StakingProvider {
    protected config: TonStakersProviderConfig;
    private cache: StakingCache;

    /**
     * Create a new TonStakersStakingProvider instance.
     *
     * @param config - Optional configuration with custom contract addresses per network
     */
    constructor(config: TonStakersProviderConfig = {}) {
        super('tonstakers');

        this.config = Object.entries(config).reduce((acc, [chainId, configByNetwork]) => {
            if (!configByNetwork.contractAddress && !STAKING_CONTRACT_ADDRESS[chainId]) {
                throw new Error(`Contract address not found for chain ${chainId}, provide it in config`);
            }

            acc[chainId] = {
                ...configByNetwork,
                contractAddress: configByNetwork.contractAddress || STAKING_CONTRACT_ADDRESS[chainId],
            };

            return acc;
        }, {} as TonStakersProviderConfig);

        this.cache = new StakingCache();
        log.info('TonStakersStakingProvider initialized');
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

        const stakingInfo = await this.getStakingProviderInfo(params.network);
        const contract = this.getContract(params.network);
        const rates = await contract.getRates();

        if (params.direction === 'stake') {
            // User deposits TON, receives tsTON: tsTON = TON / rate
            const amountInTokens = Number(params.amount);
            const amountOutTokens = amountInTokens / rates.tsTONTONProjected;
            const amountOut = amountOutTokens.toFixed(9);

            return {
                direction: 'stake',
                amountIn: params.amount,
                amountOut,
                network: params.network || Network.mainnet(),
                providerId: 'tonstakers',
                apy: stakingInfo.apy,
            };
        } else {
            // User burns tsTON, receives TON: TON = tsTON * rate
            const amountInTokens = Number(params.amount);
            const amountOutTokens =
                params.unstakeMode === 'instant'
                    ? amountInTokens * rates.tsTONTON
                    : amountInTokens * rates.tsTONTONProjected;
            const amountOut = amountOutTokens.toFixed(9);

            return {
                direction: 'unstake',
                amountIn: params.amount,
                amountOut,
                network: params.network || Network.mainnet(),
                providerId: 'tonstakers',
                unstakeMode: params.unstakeMode || 'delayed',
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
     * @param params - Stake parameters including quote and user address
     * @returns Transaction request ready to be signed and sent
     */
    async buildStakeTransaction(params: StakeParams): Promise<TransactionRequest> {
        log.debug('TonStakers stake requested', { params });

        const network = params.quote.network;
        const contractAddress = this.getStakingContractAddress(network);
        const amount = parseUnits(params.quote.amountIn, 9);
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
     * @param params - Unstake parameters including quote and user address
     * @returns Transaction request ready to be signed and sent
     */
    async buildUnstakeTransaction(params: UnstakeParams): Promise<TransactionRequest> {
        log.debug('TonStakers unstake requested', { amount: params.quote.amountIn, userAddress: params.userAddress });

        const network = params.quote.network;
        const amount = parseUnits(params.quote.amountIn, 9);
        const unstakeMode = params.quote.unstakeMode || 'delayed';

        let waitTillRoundEnd = false;
        let fillOrKill = false;

        switch (unstakeMode) {
            case 'instant':
                waitTillRoundEnd = false;
                fillOrKill = true;
                break;
            case 'bestRate':
                waitTillRoundEnd = true;
                fillOrKill = false;
                break;
            case 'delayed':
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
    async getStakedBalance(userAddress: UserFriendlyAddress, network?: Network): Promise<StakingBalance> {
        log.debug('TonStakers balance requested', { userAddress, network });

        try {
            const targetNetwork = network ?? Network.mainnet();

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
                stakedBalance: formatUnits(stakedBalance, 9), // in tsTON tokens
                instantUnstakeAvailable: formatUnits(instantUnstakeAvailable, 9),
                providerId: 'tonstakers',
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
     * APY is fetched from TonAPI.
     * Results are cached for 30 seconds to reduce API calls.
     *
     * @param network - Network to query (defaults to mainnet)
     * @returns Staking info with APY and available instant liquidity
     */
    async getStakingProviderInfo(network?: Network): Promise<StakingProviderInfo> {
        log.debug('TonStakers info requested', { network });

        const targetNetwork = network ?? Network.mainnet();
        const cacheKey = `staking-info:${targetNetwork.chainId}`;

        return await this.cache.get(cacheKey, async () => {
            const contract = this.getContract(targetNetwork);
            const instantLiquidity = await contract.getPoolBalance();
            const apy = await this.getApyFromTonApi(targetNetwork);

            return {
                apy,
                instantUnstakeAvailable: formatUnits(instantLiquidity, 9),
                providerId: 'tonstakers',
            };
        });
    }

    /**
     * Clear all cached data.
     * Use this to force fresh data retrieval on next call.
     */
    clearCache(): void {
        this.cache.clear();
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

    private getApiClient(network?: Network): ApiClient {
        const targetNetwork = network ?? Network.mainnet();
        const apiClient = this.config[targetNetwork.chainId].apiClient;
        if (!apiClient) {
            throw new Error(`API client not found for chain ${targetNetwork.chainId}`);
        }
        return apiClient;
    }

    private async getApyFromTonApi(network: Network): Promise<number> {
        const networkConfig = this.config[network.chainId];
        const token = networkConfig?.tonApiToken;
        const address = this.getStakingContractAddress(network);
        const client = new ApiClientTonApi({ network, apiKey: token });

        const poolInfo = await client.getJson<{ pool: { apy: number } }>(`/v2/staking/pool/${address}`);

        if (!poolInfo?.pool?.apy) {
            throw new Error('Invalid APY data from TonAPI');
        }

        return Number(poolInfo.pool.apy);
    }
}
