/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Network, UnstakeMode } from '../../../api/models';
import type {
    TransactionRequest,
    UserFriendlyAddress,
    StakeParams,
    StakingBalance,
    StakingProviderInfo,
    StakingQuoteParams,
    StakingQuote,
} from '../../../api/models';
import { globalLogger } from '../../../core/Logger';
import { StakingProvider } from '../StakingProvider';
import { StakingError, StakingErrorCode } from '../errors';
import type { TonStakersChainConfig, TonStakersProviderConfig } from './models/TonStakersProviderConfig';
import type { ProviderFactoryContext } from '../../../types/factory';
import type { NetworkManager } from '../../../core/NetworkManager';
import { CONTRACT, STAKING_CONTRACT_ADDRESS } from './constants';
import { PoolContract } from './PoolContract';
import { StakingCache } from './StakingCache';
import { ApiClientTonApi } from '../../../clients/tonapi/ApiClientTonApi';
import { formatUnits, parseUnits } from '../../../utils/units';
import type { ApiClient } from '../../../types/toncenter/ApiClient';
import type { UnstakeModes } from '../../../api/models/staking/UnstakeMode';

const log = globalLogger.createChild('TonStakersStakingProvider');

/**
 * TonStakersStakingProvider - Staking provider for the Tonstakers liquid staking protocol.
 *
 * This provider implements all staking operations. It supports:
 * - Stake: Deposit TON to receive tsTON liquid staking tokens
 * - Unstake: Burn tsTON to withdraw TON with {@link UnstakeMode} values:
 *   - `INSTANT` – immediate withdrawal if the pool has liquidity (`fillOrKill`)
 *   - `WHEN_AVAILABLE` – withdraw when liquidity is available (non–fill-or-kill)
 *   - `ROUND_END` – wait until round end for the projected rate
 */
export class TonStakersStakingProvider extends StakingProvider {
    private readonly networkManager: NetworkManager;
    private readonly chainConfig: Record<string, TonStakersChainConfig>;
    private cache: StakingCache;

    /**
     * @internal Use {@link createTonstakersProvider} (AppKit) or {@link TonStakersStakingProvider.createFromContext}.
     */
    private constructor(networkManager: NetworkManager, chainConfig: Record<string, TonStakersChainConfig>) {
        super('tonstakers');

        this.networkManager = networkManager;
        this.chainConfig = chainConfig;
        this.cache = new StakingCache();
        log.info('TonStakersStakingProvider initialized');
    }

    /**
     * Resolves API clients from {@link ProviderFactoryContext.networkManager} on each call.
     * Only networks with a known Tonstakers pool (or `contractAddress` in {@link TonStakersProviderConfig}) are registered.
     */
    static createFromContext(
        ctx: ProviderFactoryContext,
        config: TonStakersProviderConfig = {},
    ): TonStakersStakingProvider {
        const chainConfig: Record<string, TonStakersChainConfig> = {};

        for (const network of ctx.networkManager.getConfiguredNetworks()) {
            const chainId = network.chainId;
            const perChain = config[chainId] ?? {};
            const defaultContract = STAKING_CONTRACT_ADDRESS[chainId as keyof typeof STAKING_CONTRACT_ADDRESS];
            if (!defaultContract && !perChain.contractAddress) {
                continue;
            }

            const contractAddress = (perChain.contractAddress ?? defaultContract) as UserFriendlyAddress;
            chainConfig[chainId] = {
                contractAddress,
                ...(perChain.tonApiToken !== undefined ? { tonApiToken: perChain.tonApiToken } : {}),
            };
        }

        if (Object.keys(chainConfig).length === 0) {
            throw new Error(
                'createTonstakersProvider: no eligible networks (add mainnet/testnet or pass contractAddress in overrides)',
            );
        }

        return new TonStakersStakingProvider(ctx.networkManager, chainConfig);
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

            const quote: StakingQuote = {
                direction: 'stake',
                amountIn: params.amount,
                amountOut,
                network: params.network || Network.mainnet(),
                providerId: 'tonstakers',
                apy: stakingInfo.apy,
            };
            return quote;
        } else {
            // User burns tsTON, receives TON: TON = tsTON * rate
            const amountInTokens = Number(params.amount);
            const amountOutTokens =
                params.unstakeMode === UnstakeMode.INSTANT || params.unstakeMode === UnstakeMode.WHEN_AVAILABLE
                    ? amountInTokens * rates.tsTONTON
                    : amountInTokens * rates.tsTONTONProjected;
            const amountOut = amountOutTokens.toFixed(9);

            const quote: StakingQuote = {
                direction: 'unstake',
                amountIn: params.amount,
                amountOut,
                network: params.network || Network.mainnet(),
                providerId: 'tonstakers',
                unstakeMode: params.unstakeMode ?? UnstakeMode.INSTANT,
            };
            return quote;
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
        if (params.quote.direction === 'stake') {
            return this.buildStakeTonTransaction(params);
        } else {
            return this.buildUnstakeTonTransaction(params);
        }
    }

    private async buildStakeTonTransaction(params: StakeParams): Promise<TransactionRequest> {
        log.debug('TonStakers stake requested', { params });
        if (params.quote.direction !== 'stake') {
            throw new StakingError('Invalid quote direction', StakingErrorCode.InvalidParams, {
                quote: params.quote,
            });
        }

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
     * Mode mapping matches {@link getQuote} / {@link StakingQuote.unstakeMode} using {@link UnstakeMode}.
     *
     * @param params - Unstake parameters including quote and user address
     * @returns Transaction request ready to be signed and sent
     */
    private async buildUnstakeTonTransaction(params: StakeParams): Promise<TransactionRequest> {
        log.debug('TonStakers unstake requested', { amount: params.quote.amountIn, userAddress: params.userAddress });
        if (params.quote.direction !== 'unstake') {
            throw new StakingError('Invalid quote direction', StakingErrorCode.InvalidParams, {
                quote: params.quote,
            });
        }

        const network = params.quote.network;
        const amount = parseUnits(params.quote.amountIn, 9);
        const unstakeMode = params.quote.unstakeMode ?? UnstakeMode.INSTANT;

        /* if(optimistic_deposit_withdrawals &
                    request_immediate_withdrawal_if_possible &
                    (state == state::NORMAL) &
                    (available_funds > approximate_amount)) {
                throw_unless(error::output_amount_is_zero, approximate_amount > 0);
                total_balance -= approximate_amount;
                supply -= jetton_amount;
                raw_reserve(balance - msg_value - approximate_amount - sent_during_rotation, 0);
                available_funds -= approximate_amount;
                var msg = begin_cell()
                        .store_msg_flags(msgflag::NON_BOUNCEABLE)
                        .store_slice(from_address)
                        .store_coins(0)
                        .store_msgbody_prefix_slice()
                        .store_body_header(pool::withdrawal, query_id);
                send_raw_message(msg.end_cell(), sendmode::CARRY_ALL_BALANCE);
            } else {
                throw_if(105, fill_or_kill);
                throw_unless(error::output_amount_is_zero, jetton_amount);
                raw_reserve(balance - msg_value - sent_during_rotation, 0);
                request_to_mint_withdrawal(from_address, jetton_amount, query_id);
            }
         */

        // ~ request_immediate_withdrawal_if_possible
        let waitTillRoundEnd = false;

        // Used once in TS contracts
        // If contract does not have enough liquidity, it will throw an error
        let fillOrKill = false;

        switch (unstakeMode) {
            case UnstakeMode.INSTANT:
                waitTillRoundEnd = false;
                fillOrKill = true;
                break;
            case UnstakeMode.ROUND_END:
                waitTillRoundEnd = true;
                fillOrKill = false;
                break;
            case UnstakeMode.WHEN_AVAILABLE:
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
     * Returns {@link StakingBalance}: `stakedBalance` (tsTON), `instantUnstakeAvailable` (pool TON liquidity
     * for instant unstake), and `providerId`.
     *
     * @param userAddress - User wallet address
     * @param network - Network to query (defaults to mainnet)
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
     * Get supported unstake modes
     * @returns An array of supported unstake modes
     */
    getSupportedUnstakeModes(): UnstakeModes[] {
        return [UnstakeMode.INSTANT, UnstakeMode.WHEN_AVAILABLE, UnstakeMode.ROUND_END];
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
        const entry = this.chainConfig[targetNetwork.chainId];

        if (!entry?.contractAddress) {
            throw new StakingError(
                'Staking contract address is not configured for the selected network',
                StakingErrorCode.InvalidParams,
                { network: targetNetwork },
            );
        }

        return entry.contractAddress;
    }

    private getContract(network?: Network): PoolContract {
        const targetNetwork = network ?? Network.mainnet();
        const apiClient = this.getApiClient(targetNetwork);
        const contractAddress = this.getStakingContractAddress(targetNetwork);
        return new PoolContract(contractAddress, apiClient);
    }

    private getApiClient(network?: Network): ApiClient {
        const targetNetwork = network ?? Network.mainnet();
        if (!this.chainConfig[targetNetwork.chainId]) {
            throw new StakingError('Tonstakers is not available on this network', StakingErrorCode.InvalidParams, {
                network: targetNetwork,
            });
        }
        return this.networkManager.getClient(targetNetwork);
    }

    private async getApyFromTonApi(network: Network): Promise<number> {
        const token = this.chainConfig[network.chainId]?.tonApiToken;
        const address = this.getStakingContractAddress(network);
        const client = new ApiClientTonApi({ network, apiKey: token });

        const poolInfo = await client.getJson<{ pool: { apy: number } }>(`/v2/staking/pool/${address}`);

        if (!poolInfo?.pool?.apy) {
            throw new Error('Invalid APY data from TonAPI');
        }

        return Number(poolInfo.pool.apy);
    }
}

/**
 * Returns an AppKit / `ProviderInput` factory: pass to `providers: [createTonstakersProvider(config)]`.
 * At kit init, the factory receives context and builds the provider using `ctx.networkManager` for RPC.
 */
export function createTonstakersProvider(
    config: TonStakersProviderConfig = {},
): (ctx: ProviderFactoryContext) => TonStakersStakingProvider {
    return (ctx: ProviderFactoryContext) => TonStakersStakingProvider.createFromContext(ctx, config);
}
