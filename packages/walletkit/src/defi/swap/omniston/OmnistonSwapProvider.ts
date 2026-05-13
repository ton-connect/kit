/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { SettlementMethod, Omniston, GaslessSettlement } from '@ston-fi/omniston-sdk';
import type { Quote, QuoteResponseEvent, QuoteRequest } from '@ston-fi/omniston-sdk';
import { Address } from '@ton/core';

import type { OmnistonQuoteMetadata, OmnistonSwapProviderConfig, OmnistonProviderOptions } from './models';
import { SwapProvider } from '../SwapProvider';
import type { SwapQuoteParams, SwapQuote, SwapParams, SwapProviderMetadata } from '../../../api/models';
import { Network } from '../../../api/models';
import { SwapError, SwapErrorCode } from '../errors';
import { globalLogger } from '../../../core/Logger';
import { tokenToAddress, toOmnistonAddress, isOmnistonQuoteMetadata } from './utils';
import type { TransactionRequest } from '../../../api/models';
import { asBase64, getUnixtime } from '../../../utils';
import { formatUnits, parseUnits } from '../../../utils/units';
import type { ProviderFactoryContext } from '../../../types/factory';

const log = globalLogger.createChild('OmnistonSwapProvider');

/**
 * Swap provider implementation for Omniston (STON.fi) protocol
 *
 * Uses the Omniston SDK to get quotes and build swap transactions
 * across multiple DEXs on TON blockchain.
 *
 * @sample docs/examples/src/appkit/swap#OMNISTON_QUICK_START
 */
export class OmnistonSwapProvider extends SwapProvider<OmnistonProviderOptions> {
    private readonly apiUrl: string;
    private readonly defaultSlippageBps: number;
    private readonly quoteTimeoutMs: number;
    private readonly referrerAddress?: string;
    private readonly referrerFeeBps?: number;
    private readonly flexibleReferrerFee: boolean;
    private omniston$?: Omniston;
    private metadata: SwapProviderMetadata = {
        name: 'Omniston',
        url: 'https://ston.fi/omniston',
    };

    readonly providerId: string;

    /**
     * @param config - Optional {@link OmnistonSwapProviderConfig}. Defaults are filled in for any field left undefined.
     * @expand config
     */
    constructor(config?: OmnistonSwapProviderConfig) {
        super();
        this.providerId = config?.providerId ?? 'omniston';
        this.apiUrl = config?.apiUrl ?? 'wss://omni-ws.ston.fi';
        this.defaultSlippageBps = config?.defaultSlippageBps ?? 100; // 1% default
        this.quoteTimeoutMs = config?.quoteTimeoutMs ?? 10000; // 10 seconds
        this.referrerAddress = config?.referrerAddress
            ? Address.parse(config?.referrerAddress).toString({ bounceable: true })
            : undefined;
        this.referrerFeeBps = config?.referrerFeeBps;
        this.flexibleReferrerFee = config?.flexibleReferrerFee ?? false;

        if (config?.metadata) {
            this.metadata = {
                ...this.metadata,
                ...config.metadata,
            };
        }

        log.info('OmnistonSwapProvider initialized', {
            defaultSlippageBps: this.defaultSlippageBps,
            hasReferrer: !!this.referrerAddress,
        });
    }

    getSupportedNetworks(): Network[] {
        return [Network.mainnet()];
    }

    getMetadata(): SwapProviderMetadata {
        return this.metadata;
    }

    private get omniston(): Omniston {
        if (!this.omniston$) {
            this.omniston$ = new Omniston({ apiUrl: this.apiUrl });
        }

        return this.omniston$;
    }

    async getQuote(params: SwapQuoteParams<OmnistonProviderOptions>): Promise<SwapQuote> {
        log.debug('Getting Omniston quote', {
            fromToken: params.from,
            toToken: params.to,
            amount: params.amount,
            isReverseSwap: params.isReverseSwap,
        });

        try {
            const bidAssetAddress = tokenToAddress(params.from);
            const askAssetAddress = tokenToAddress(params.to);

            const slippageBps = params.slippageBps ?? this.defaultSlippageBps;

            // Use providerOptions if provided, otherwise fall back to config values
            const referrerAddress = params.providerOptions?.referrerAddress ?? this.referrerAddress;
            const referrerFeeBps = params.providerOptions?.referrerFeeBps ?? this.referrerFeeBps;
            const flexibleReferrerFee = params.providerOptions?.flexibleReferrerFee ?? this.flexibleReferrerFee;

            // Determine amount based on whether amountFrom or amountTo is specified
            const amount = params.isReverseSwap
                ? { askUnits: parseUnits(params.amount, params.to.decimals).toString() }
                : { bidUnits: parseUnits(params.amount, params.from.decimals).toString() };

            const quoteRequest: QuoteRequest = {
                amount,
                settlementMethods: params.providerOptions?.settlementMethods ?? [
                    SettlementMethod.SETTLEMENT_METHOD_SWAP,
                ],
                bidAssetAddress: toOmnistonAddress(bidAssetAddress, params.network),
                askAssetAddress: toOmnistonAddress(askAssetAddress, params.network),
                referrerAddress: referrerAddress
                    ? toOmnistonAddress(Address.parse(referrerAddress).toString({ bounceable: true }), params.network)
                    : undefined,
                referrerFeeBps: referrerFeeBps,
                settlementParams: {
                    gaslessSettlement: GaslessSettlement.GASLESS_SETTLEMENT_POSSIBLE,
                    maxPriceSlippageBps: slippageBps,
                    maxOutgoingMessages: params.maxOutgoingMessages ?? 1,
                    flexibleReferrerFee: flexibleReferrerFee,
                },
            };

            const quoteEvent = await new Promise<QuoteResponseEvent>((resolve, reject) => {
                let isSettled = false;

                log.debug('Requesting quote', { quoteRequest });

                const timeoutId = setTimeout(() => {
                    log.debug('Timeout reached');

                    if (!isSettled) {
                        isSettled = true;
                        reject(new SwapError('Quote request timed out', SwapErrorCode.NetworkError));
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
                            reject(
                                new SwapError('No quote available for this swap', SwapErrorCode.InsufficientLiquidity),
                            );
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
                throw new SwapError('Quote data is missing', SwapErrorCode.InvalidQuote);
            }

            const quote = quoteEvent.quote;
            const swapQuote = this.mapOmnistonQuoteToSwapQuote(quote, params);

            log.debug('Received Omniston quote', {
                quoteId: quote.quoteId,
                bidUnits: quote.bidUnits,
                askUnits: quote.askUnits,
            });

            return swapQuote;
        } catch (error) {
            log.error('Failed to get Omniston quote', { error, params });

            if (error instanceof SwapError) {
                throw error;
            }

            throw new SwapError(
                `Omniston quote request failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                SwapErrorCode.NetworkError,
                error,
            );
        }
    }

    async buildSwapTransaction(params: SwapParams): Promise<TransactionRequest> {
        log.debug('Building Omniston swap transaction', params);

        const metadata = params.quote.metadata;

        if (!metadata || !isOmnistonQuoteMetadata(metadata)) {
            throw new SwapError('Invalid quote: missing Omniston quote data', SwapErrorCode.InvalidQuote);
        }

        try {
            const omnistonQuote = metadata.omnistonQuote;
            const now = getUnixtime();

            if (omnistonQuote.tradeStartDeadline && omnistonQuote.tradeStartDeadline < now) {
                throw new SwapError('Quote has expired, please request a new one', SwapErrorCode.QuoteExpired);
            }

            const userAddress = Address.parse(params.userAddress).toRawString();
            const omnistonUserAddress = toOmnistonAddress(userAddress, params.quote.network);

            // Use destinationAddress if provided, otherwise use userAddress
            const destinationAddressRaw = params.destinationAddress
                ? Address.parse(params.destinationAddress).toRawString()
                : userAddress;
            const omnistonDestinationAddress = toOmnistonAddress(destinationAddressRaw, params.quote.network);

            const transactionRequest = {
                quote: omnistonQuote,
                sourceAddress: omnistonUserAddress,
                destinationAddress: omnistonDestinationAddress,
                gasExcessAddress: omnistonUserAddress,
                refundAddress: omnistonUserAddress,
                useRecommendedSlippage: true,
            };

            const buildResult = await this.omniston.buildTransfer(transactionRequest);
            const messages = buildResult?.ton?.messages;

            if (!messages || messages.length === 0) {
                throw new SwapError('Failed to build transaction: no messages returned', SwapErrorCode.BuildTxFailed);
            }

            const transaction: TransactionRequest = {
                fromAddress: params.userAddress,
                messages: messages.map((message) => ({
                    address: message.targetAddress,
                    amount: message.sendAmount,
                    payload: asBase64(message.payload),
                    stateInit: message.jettonWalletStateInit ? asBase64(message.jettonWalletStateInit) : undefined,
                })),
                network: params.quote.network,
            };

            log.debug('Built Omniston swap transaction', {
                quoteId: metadata.omnistonQuote.quoteId,
                transaction,
            });

            return transaction;
        } catch (error) {
            log.error('Failed to build Omniston swap transaction', { error, params });

            if (error instanceof SwapError) {
                throw error;
            }

            throw new SwapError(
                `Failed to build Omniston transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
                SwapErrorCode.NetworkError,
                error,
            );
        }
    }

    private mapOmnistonQuoteToSwapQuote(quote: Quote, params: SwapQuoteParams): SwapQuote {
        const metadata: OmnistonQuoteMetadata = {
            omnistonQuote: quote,
        };

        // if (quote.protocolFeeAsset) {
        //     fee.push({
        //         amount: formatUnits(quote.protocolFeeUnits, 9),
        //         token: addressToToken(quote.protocolFeeAsset.address),
        //     });
        // }

        // if (quote.referrerFeeAsset) {
        //     fee.push({
        //         amount: formatUnits(quote.referrerFeeUnits, 9),
        //         token: addressToToken(quote.referrerFeeAsset.address),
        //     });
        // }

        return {
            rawFromAmount: quote.bidUnits,
            rawToAmount: quote.askUnits,
            rawMinReceived: quote.askUnits,

            fromAmount: formatUnits(quote.bidUnits, params.from.decimals),
            toAmount: formatUnits(quote.askUnits, params.to.decimals),
            minReceived: formatUnits(quote.askUnits, params.to.decimals),

            metadata,
            providerId: this.providerId,
            fromToken: params.from,
            toToken: params.to,

            network: params.network,
            expiresAt: quote.tradeStartDeadline ? quote.tradeStartDeadline : undefined,
        };
    }
}

/**
 * Returns an AppKit / `ProviderInput` factory for {@link OmnistonSwapProvider}:
 * pass to `providers: [createOmnistonProvider(config)]`.
 *
 * @param config - Optional {@link OmnistonSwapProviderConfig}. Defaults are filled in for any field left undefined.
 * @expand config
 */
export const createOmnistonProvider = (
    config: OmnistonSwapProviderConfig = {},
): ((ctx: ProviderFactoryContext) => OmnistonSwapProvider) => {
    return () => new OmnistonSwapProvider(config);
};
