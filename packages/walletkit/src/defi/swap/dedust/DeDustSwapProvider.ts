/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address } from '@ton/core';

import type {
    DeDustQuoteMetadata,
    DeDustSwapProviderConfig,
    DeDustProviderOptions,
    DeDustQuoteResponse,
} from './models';
import type { DeDustSwapResponse } from './DeDustPrivateTypes';
import { SwapProvider } from '../SwapProvider';
import type { SwapQuoteParams, SwapQuote, SwapParams } from '../../../api/models';
import { SwapError } from '../errors';
import { globalLogger } from '../../../core/Logger';
import { tokenToMinter, validateNetwork, isDeDustQuoteMetadata } from './utils';
import type { TransactionRequest } from '../../../api/models';
import { asBase64 } from '../../../utils';
import { formatUnits, parseUnits } from '../../../utils/units';

const log = globalLogger.createChild('DeDustSwapProvider');

/**
 * Default API URL for DeDust Router
 */
const DEFAULT_API_URL = 'https://api-mainnet.dedust.io';

/**
 * Default protocols to use for routing
 */
const DEFAULT_PROTOCOLS = [
    'dedust',
    'dedust_v3',
    // 'dedust_v3_memepad',
    'stonfi_v1',
    'stonfi_v2',
    'tonco',
    // 'memeslab',
    // 'tonfun',
];

/**
 * Swap provider implementation for DeDust protocol using Router v2 API
 *
 * Uses the DeDust Router API to get quotes and build swap transactions
 * with optimal routing across multiple pools and protocols.
 *
 * @example
 * ```typescript
 * import { DeDustSwapProvider } from '@ton/walletkit/swap/dedust';
 *
 * const provider = new DeDustSwapProvider({
 *   defaultSlippageBps: 100, // 1%
 *   referralAddress: 'EQ...',
 *   referralFeeBps: 50 // 0.5%
 * });
 *
 * kit.swap.registerProvider(provider);
 * ```
 */
export class DeDustSwapProvider extends SwapProvider<DeDustProviderOptions, DeDustProviderOptions> {
    private readonly apiUrl: string;
    private readonly defaultSlippageBps: number;
    private readonly referralAddress?: string;
    private readonly referralFeeBps?: number;
    private readonly onlyVerifiedPools: boolean;
    private readonly maxSplits: number;
    private readonly maxLength: number;
    private readonly minPoolUsdTvl: string;

    readonly providerId: string;

    constructor(config?: DeDustSwapProviderConfig) {
        super();
        this.providerId = config?.providerId ?? 'dedust';
        this.apiUrl = config?.apiUrl ?? DEFAULT_API_URL;
        this.defaultSlippageBps = config?.defaultSlippageBps ?? 100; // 1% default
        this.referralAddress = config?.referralAddress;
        this.referralFeeBps = config?.referralFeeBps;
        this.onlyVerifiedPools = config?.onlyVerifiedPools ?? true;
        this.maxSplits = config?.maxSplits ?? 4;
        this.maxLength = config?.maxLength ?? 3;
        this.minPoolUsdTvl = config?.minPoolUsdTvl ?? '5000';

        log.info('DeDustSwapProvider initialized', {
            apiUrl: this.apiUrl,
            defaultSlippageBps: this.defaultSlippageBps,
            hasReferral: !!this.referralAddress,
        });
    }

    async getQuote(params: SwapQuoteParams<DeDustProviderOptions>): Promise<SwapQuote> {
        log.debug('Getting DeDust quote', {
            fromToken: params.from,
            toToken: params.to,
            amount: params.amount,
            isReverseSwap: params.isReverseSwap,
        });

        // Validate network (DeDust only supports mainnet)
        validateNetwork(params.network);

        const slippageBps = params.slippageBps ?? this.defaultSlippageBps;
        const swapMode = params.isReverseSwap ? 'exact_out' : 'exact_in';
        const amount = params.isReverseSwap
            ? parseUnits(params.amount, params.to.decimals).toString()
            : parseUnits(params.amount, params.from.decimals).toString();

        try {
            const inMinter = tokenToMinter(params.from);
            const outMinter = tokenToMinter(params.to);

            const requestBody = {
                in_minter: inMinter,
                out_minter: outMinter,
                amount,
                swap_mode: swapMode,
                slippage_bps: slippageBps,
                protocols: params.providerOptions?.protocols ?? DEFAULT_PROTOCOLS,
                exclude_protocols: params.providerOptions?.excludeProtocols,
                only_verified_pools: params.providerOptions?.onlyVerifiedPools ?? this.onlyVerifiedPools,
                max_splits: params.providerOptions?.maxSplits ?? this.maxSplits,
                max_length: params.providerOptions?.maxLength ?? this.maxLength,
                min_pool_usd_tvl: this.minPoolUsdTvl,
                exclude_volatile_pools: params.providerOptions?.excludeVolatilePools,
            };

            const response = await fetch(`${this.apiUrl}/v1/router/quote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                log.error('DeDust quote API error', { status: response.status, error: errorText });

                if (response.status === 400) {
                    throw new SwapError(`No route found for swap: ${errorText}`, SwapError.INSUFFICIENT_LIQUIDITY);
                }

                throw new SwapError(`DeDust API error: ${response.status} ${errorText}`, SwapError.NETWORK_ERROR);
            }

            const quoteResponse: DeDustQuoteResponse = await response.json();

            if (!quoteResponse.swap_is_possible) {
                throw new SwapError('Swap is not possible for this pair', SwapError.INSUFFICIENT_LIQUIDITY);
            }

            if (!quoteResponse.swap_data?.routes || quoteResponse.swap_data.routes.length === 0) {
                throw new SwapError('No routes found for this swap', SwapError.INSUFFICIENT_LIQUIDITY);
            }

            // Calculate min received based on slippage
            const outAmount = BigInt(quoteResponse.out_amount);
            const minReceived = (outAmount * BigInt(10000 - slippageBps)) / BigInt(10000);

            // Build metadata
            const metadata: DeDustQuoteMetadata = {
                quoteResponse,
                slippageBps,
            };

            const swapQuote: SwapQuote = {
                metadata,
                providerId: this.providerId,
                fromToken: params.from,
                toToken: params.to,
                rawFromAmount: quoteResponse.in_amount,
                rawToAmount: quoteResponse.out_amount,
                rawMinReceived: minReceived.toString(),
                fromAmount: formatUnits(quoteResponse.in_amount, params.from.decimals),
                toAmount: formatUnits(quoteResponse.out_amount, params.to.decimals),
                minReceived: formatUnits(minReceived.toString(), params.to.decimals),
                network: params.network,
                priceImpact: quoteResponse.price_impact ? Math.round(quoteResponse.price_impact * 100) : undefined,
            };

            log.debug('Received DeDust quote', {
                inAmount: quoteResponse.in_amount,
                outAmount: quoteResponse.out_amount,
                minReceived: minReceived.toString(),
                routeCount: quoteResponse.swap_data.routes.length,
            });

            return swapQuote;
        } catch (error) {
            log.error('Failed to get DeDust quote', { error, params });

            if (error instanceof SwapError) {
                throw error;
            }

            throw new SwapError(
                `DeDust quote request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                SwapError.NETWORK_ERROR,
                error,
            );
        }
    }

    async buildSwapTransaction(params: SwapParams<DeDustProviderOptions>): Promise<TransactionRequest> {
        log.debug('Building DeDust swap transaction', params);

        const metadata = params.quote.metadata;

        if (!metadata || !isDeDustQuoteMetadata(metadata)) {
            throw new SwapError('Invalid quote: missing DeDust quote data', SwapError.INVALID_QUOTE);
        }

        try {
            const userAddress = Address.parse(params.userAddress).toRawString();

            // Use custom referral from params, or fall back to config
            const referralAddress = params.providerOptions?.referralAddress ?? this.referralAddress;
            const referralFeeBps = params.providerOptions?.referralFeeBps ?? this.referralFeeBps;

            const requestBody = {
                sender_address: userAddress,
                swap_data: metadata.quoteResponse.swap_data,
                referral_address: referralAddress ? Address.parse(referralAddress).toRawString() : undefined,
                referral_fee: referralFeeBps,
            };

            const response = await fetch(`${this.apiUrl}/v1/router/swap`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify(requestBody),
            });

            if (!response.ok) {
                const errorText = await response.text();
                log.error('DeDust swap API error', { status: response.status, error: errorText });
                throw new SwapError(
                    `DeDust swap API error: ${response.status} ${errorText}`,
                    SwapError.BUILD_TX_FAILED,
                );
            }

            const swapResponse: DeDustSwapResponse = await response.json();

            if (!swapResponse.transactions || swapResponse.transactions.length === 0) {
                throw new SwapError('No transactions returned from swap API', SwapError.BUILD_TX_FAILED);
            }

            const transaction: TransactionRequest = {
                fromAddress: params.userAddress,
                messages: swapResponse.transactions.map((tx) => ({
                    address: Address.parse(tx.address).toString(),
                    amount: tx.amount,
                    payload: asBase64(tx.payload),
                    stateInit: tx.state_init ? asBase64(tx.state_init) : undefined,
                })),
                network: params.quote.network,
            };

            log.debug('Built DeDust swap transaction', {
                messageCount: transaction.messages.length,
            });

            return transaction;
        } catch (error) {
            log.error('Failed to build DeDust swap transaction', { error, params });

            if (error instanceof SwapError) {
                throw error;
            }

            throw new SwapError(
                `Failed to build DeDust transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
                SwapError.BUILD_TX_FAILED,
                error,
            );
        }
    }
}
