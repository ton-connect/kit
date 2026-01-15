/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { SettlementMethod, Omniston, GaslessSettlement } from '@ston-fi/omniston-sdk';
import type { Quote, QuoteResponseEvent, QuoteRequest } from '@ston-fi/omniston-sdk';

import type { OmnistonQuoteMetadata } from './types';
import { StakingProvider } from '../StakingProvider';
import type { SwapQuoteParams, SwapQuote, SwapParams, SwapFee } from '../types';
import { SwapError } from '../errors';
import type { NetworkManager } from '../../../core/NetworkManager';
import type { EventEmitter } from '../../../core/EventEmitter';
import { globalLogger } from '../../../core/Logger';
import { tokenToAddress, addressToToken, toOmnistonAddress, isOmnistonQuoteMetadata } from './utils';
import type { TransactionRequest } from '../../../api/models';

const log = globalLogger.createChild('TonstakersProvider');

export interface TonstakersProviderConfig {
    apiUrl?: string;
    defaultSlippageBps?: number;
    quoteTimeoutMs?: number;
    referrerAddress?: string;
    referrerFeeBps?: number;
    flexibleReferrerFee?: boolean;
}

/**
 * Swap provider implementation for Omniston (STON.fi) protocol
 *
 * Uses the Omniston SDK to get quotes and build swap transactions
 * across multiple DEXs on TON blockchain.
 *
 * @example
 * ```typescript
 * // Import from separate entry point to avoid bundling Omniston SDK
 * import { OmnistonSwapProvider } from '@ton/walletkit/swap/omniston';
 * import { Omniston } from '@ston-fi/omniston-sdk';
 *
 * const omniston = new Omniston({
 *   apiUrl: 'wss://omni-ws.ston.fi'
 * });
 *
 * const provider = new OmnistonSwapProvider(
 *   kit.getNetworkManager(),
 *   kit.getEventEmitter(),
 *   {
 *     omnistonInstance: omniston,
 *     defaultSlippageBps: 100, // 1%
 *     referrerAddress: 'EQ...',
 *     referrerFeeBps: 10 // 0.1%
 *   }
 * );
 *
 * kit.swap.registerProvider('omniston', provider);
 * ```
 */
export class TonstakersProvider extends StakingProvider {
    private readonly apiUrl: string;
    private readonly defaultSlippageBps: number;
    private readonly quoteTimeoutMs: number;
    private readonly referrerAddress?: string;
    private readonly referrerFeeBps?: number;
    private readonly flexibleReferrerFee: boolean;

    private omniston$?: Omniston;

    constructor(networkManager: NetworkManager, eventEmitter: EventEmitter, config: TonstakersProviderConfig) {
        super(networkManager, eventEmitter);
        this.apiUrl = config.apiUrl ?? 'wss://omni-ws.ston.fi';
        this.defaultSlippageBps = config.defaultSlippageBps ?? 100; // 1% default
        this.quoteTimeoutMs = config.quoteTimeoutMs ?? 7000; // 10 seconds
        this.referrerAddress = config.referrerAddress;
        this.referrerFeeBps = config.referrerFeeBps;
        this.flexibleReferrerFee = config.flexibleReferrerFee ?? false;

        log.info('OmnistonSwapProvider initialized', {
            defaultSlippageBps: this.defaultSlippageBps,
            hasReferrer: !!this.referrerAddress,
        });
    }

    private get omniston(): Omniston {
        if (!this.omniston$) {
            this.omniston$ = new Omniston({ apiUrl: this.apiUrl });
        }

        return this.omniston$;
    }

    async getQuote(params: SwapQuoteParams): Promise<SwapQuote> {
        log.debug('Getting Omniston quote', {
            fromToken: params.fromToken,
            toToken: params.toToken,
            amount: params.amount,
        });

        try {
            const bidAssetAddress = tokenToAddress(params.fromToken);
            const askAssetAddress = tokenToAddress(params.toToken);

            const slippageBps = params.slippageBps ?? this.defaultSlippageBps;

            const quoteRequest: QuoteRequest = {
                settlementMethods: [SettlementMethod.SETTLEMENT_METHOD_SWAP],
                bidAssetAddress: toOmnistonAddress(bidAssetAddress, params.network),
                askAssetAddress: toOmnistonAddress(askAssetAddress, params.network),
                amount: { bidUnits: params.amount },
                referrerAddress: this.referrerAddress
                    ? toOmnistonAddress(this.referrerAddress, params.network)
                    : undefined,
                referrerFeeBps: this.referrerFeeBps,
                settlementParams: {
                    gaslessSettlement: GaslessSettlement.GASLESS_SETTLEMENT_POSSIBLE,
                    maxPriceSlippageBps: slippageBps,
                    maxOutgoingMessages: 4,
                    flexibleReferrerFee: this.flexibleReferrerFee,
                },
            };

            const quoteEvent = await new Promise<QuoteResponseEvent>((resolve, reject) => {
                let isSettled = false;

                log.debug('Requesting quote');

                const timeoutId = setTimeout(() => {
                    log.debug('Timeout reached');

                    if (!isSettled) {
                        isSettled = true;
                        reject(new SwapError('Quote request timed out', SwapError.NETWORK_ERROR));
                    }

                    unsubscribe.unsubscribe();
                }, this.quoteTimeoutMs);

                const unsubscribe = this.omniston.requestForQuote(quoteRequest).subscribe({
                    next: (event) => {
                        log.debug('Received quote event', event);

                        if (isSettled) return;

                        if (event.type === 'noQuote') {
                            isSettled = true;
                            clearTimeout(timeoutId);
                            unsubscribe.unsubscribe();
                            reject(new SwapError('No quote available for this swap', SwapError.INSUFFICIENT_LIQUIDITY));
                            return;
                        }

                        if (event.type === 'quoteUpdated') {
                            isSettled = true;
                            clearTimeout(timeoutId);
                            unsubscribe.unsubscribe();
                            resolve(event);
                        }
                    },
                    error: (error) => {
                        if (!isSettled) {
                            isSettled = true;
                            clearTimeout(timeoutId);
                            unsubscribe.unsubscribe();
                            reject(error);
                        }
                    },
                });
            });

            if (quoteEvent.type !== 'quoteUpdated') {
                throw new SwapError('Quote data is missing', SwapError.INVALID_QUOTE);
            }

            const quote = quoteEvent.quote;
            const swapQuote = this.mapOmnistonQuoteToSwapQuote(quote, params);

            log.debug('Received Omniston quote', {
                quoteId: quote.quoteId,
                bidUnits: quote.bidUnits,
                askUnits: quote.askUnits,
            });

            this.emitEvent('swap:quote:received', {
                provider: 'omniston',
                quote: swapQuote,
            });

            return swapQuote;
        } catch (error) {
            log.error('Failed to get Omniston quote', { error, params });

            if (error instanceof SwapError) {
                throw error;
            }

            throw new SwapError(
                `Omniston quote request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                SwapError.NETWORK_ERROR,
                error,
            );
        }
    }

    async buildSwapTransaction(params: SwapParams): Promise<TransactionRequest> {
        const metadata = params.quote.metadata;

        if (!metadata || !isOmnistonQuoteMetadata(metadata)) {
            throw new SwapError('Invalid quote: missing Omniston quote data', SwapError.INVALID_QUOTE);
        }

        throw new Error('buildSwapTransaction is not implemented');
    }

    private mapOmnistonQuoteToSwapQuote(quote: Quote, params: SwapQuoteParams): SwapQuote {
        const metadata: OmnistonQuoteMetadata = {
            quoteId: quote.quoteId,
            resolverId: quote.resolverId,
            resolverName: quote.resolverName,
            omnistonQuote: quote,
            network: params.network,
            gasBudget: quote.gasBudget,
            estimatedGasConsumption: quote.estimatedGasConsumption,
        };

        const fee: SwapFee[] = [];

        if (quote.protocolFeeAsset) {
            fee.push({
                amount: quote.protocolFeeUnits,
                token: addressToToken(quote.protocolFeeAsset.address),
            });
        }

        if (quote.referrerFeeAsset) {
            fee.push({
                amount: quote.referrerFeeUnits,
                token: addressToToken(quote.referrerFeeAsset.address),
            });
        }

        return {
            metadata,
            provider: 'omniston',
            fromToken: params.fromToken,
            toToken: params.toToken,
            fromAmount: quote.bidUnits,
            toAmount: quote.askUnits,
            minReceived: quote.askUnits,
            expiresAt: quote.tradeStartDeadline ? quote.tradeStartDeadline : undefined,
            fee: fee?.length ? fee : undefined,
        };
    }
}
