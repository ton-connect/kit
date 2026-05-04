/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    CryptoOnrampDeposit,
    CryptoOnrampDepositParams,
    CryptoOnrampQuote,
    CryptoOnrampQuoteParams,
    CryptoOnrampStatus,
    CryptoOnrampStatusParams,
} from '../../../api/models';
import { Network } from '../../../api/models';
import { CryptoOnrampProvider } from '../CryptoOnrampProvider';
import { CryptoOnrampError } from '../errors';
import type { SwapsXyzGetActionResponse, SwapsXyzSwapDirection } from './types';
import { isErrorResponse, isEvmAddress, mapStatus, parseChainId } from './utils';

const SWAPS_XYZ_API_URL = 'https://api-v2.swaps.xyz/api';
const TON_CHAIN_ID = 999000337;
const DEFAULT_SLIPPAGE_BPS = 100;
const DEFAULT_SENDER = '0x4C798114E4d85f9A70321E4198DF20CD920d9387';

export interface SwapsXyzProviderConfig {
    /**
     * API key issued by swaps.xyz (passed as `x-api-key`)
     */
    apiKey: string;

    /**
     * Override the base API URL. Defaults to https://api-v2.swaps.xyz/api
     */
    apiUrl?: string;

    /**
     * EVM address used as `sender` on getAction requests. Required by the API
     * even for deposit flows where the actual payer is unknown. Defaults to a
     * well-known valid address when omitted.
     */
    defaultSender?: string;
}

export interface SwapsXyzQuoteOptions {
    /**
     * TON recipient address. Required — swaps.xyz needs it at quote time for
     * cross-VM swaps, and we reuse the returned quote verbatim for deposits.
     */
    recipient: string;

    /**
     * Slippage tolerance in basis points (0-10000). Defaults to 100 (1%).
     */
    slippageBps?: number;
}

/**
 * Metadata stored on the CryptoOnrampQuote returned by this provider.
 *
 * The raw getAction response is kept here so that createDeposit can build a
 * CryptoOnrampDeposit without an extra network round-trip.
 */
export interface SwapsXyzQuoteMetadata {
    recipient: string;
    sender: string;
    response: SwapsXyzGetActionResponse;
}

/**
 * Provider implementation that routes crypto onramps through swaps.xyz.
 *
 * Supports EVM source chains only — quotes where the source chain's `vmId`
 * is not `evm` are rejected (non-EVM chains require a separate registerTxs
 * flow that we do not implement yet).
 */
export class SwapsXyzCryptoOnrampProvider extends CryptoOnrampProvider<SwapsXyzQuoteOptions, SwapsXyzQuoteMetadata> {
    readonly providerId = 'swaps-xyz';

    getSupportedNetworks(): Network[] {
        return [Network.mainnet()];
    }

    getMetadata() {
        return { name: 'Swaps.xyz', url: 'https://swaps.xyz' };
    }

    private readonly apiKey: string;
    private readonly apiUrl: string;
    private readonly defaultSender: string;

    constructor(config: SwapsXyzProviderConfig) {
        super();
        this.apiKey = config.apiKey;
        this.apiUrl = config.apiUrl ?? SWAPS_XYZ_API_URL;
        this.defaultSender = config.defaultSender ?? DEFAULT_SENDER;
    }

    async getQuote(
        params: CryptoOnrampQuoteParams<SwapsXyzQuoteOptions>,
    ): Promise<CryptoOnrampQuote<SwapsXyzQuoteMetadata>> {
        const sender = params.refundAddress ?? this.defaultSender;
        const recipient = params.providerOptions?.recipient;
        if (!recipient) {
            throw new CryptoOnrampError(
                'SwapsXyz requires a TON recipient address in providerOptions.recipient',
                CryptoOnrampError.INVALID_PARAMS,
            );
        }

        const srcChainId = parseChainId(params.sourceNetwork);
        if (srcChainId === undefined) {
            throw new CryptoOnrampError(
                `SwapsXyz: sourceNetwork must be a numeric chainId (got "${params.sourceNetwork}")`,
                CryptoOnrampError.INVALID_PARAMS,
            );
        }

        const swapDirection: SwapsXyzSwapDirection =
            params.isSourceAmount === false ? 'exact-amount-out' : 'exact-amount-in';

        if (!isEvmAddress(sender)) {
            throw new CryptoOnrampError(
                'SwapsXyz: senderAddress must be a valid EVM address (got "' + sender + '")',
                CryptoOnrampError.INVALID_REFUND_ADDRESS,
            );
        }

        const url = new URL(`${this.apiUrl}/getAction`);
        url.searchParams.set('actionType', 'swap-action');
        url.searchParams.set('sender', sender);
        url.searchParams.set('srcChainId', String(srcChainId));
        url.searchParams.set('srcToken', params.sourceCurrencyAddress);
        url.searchParams.set('dstChainId', String(TON_CHAIN_ID));
        url.searchParams.set('dstToken', params.targetCurrencyAddress);
        url.searchParams.set('amount', params.amount);
        url.searchParams.set('swapDirection', swapDirection);
        url.searchParams.set('slippage', String(params.providerOptions?.slippageBps ?? DEFAULT_SLIPPAGE_BPS));
        url.searchParams.set('recipient', recipient);
        url.searchParams.set('returnDepositAddress', 'true');

        let response: Response;
        try {
            response = await fetch(url.toString(), {
                method: 'GET',
                headers: { 'x-api-key': this.apiKey },
            });
        } catch (error) {
            throw new CryptoOnrampError(
                'SwapsXyz: network error while calling getAction',
                CryptoOnrampError.QUOTE_FAILED,
                error,
            );
        }

        const body = (await response.json().catch(() => undefined)) as SwapsXyzGetActionResponse;

        if (!response.ok || isErrorResponse(body)) {
            const err = isErrorResponse(body) ? body.error : undefined;
            throw new CryptoOnrampError(
                err?.message ?? `SwapsXyz getAction failed (HTTP ${response.status})`,
                err?.code ?? CryptoOnrampError.QUOTE_FAILED,
                err ?? { status: response.status },
            );
        }

        if (body.vmId !== 'evm') {
            throw new CryptoOnrampError(
                `SwapsXyz: only EVM source chains are supported (got vmId="${body.vmId}")`,
                CryptoOnrampError.INVALID_PARAMS,
                { vmId: body.vmId, srcChainId },
            );
        }

        const metadata: SwapsXyzQuoteMetadata = { recipient, sender, response: body };

        return {
            sourceCurrencyAddress: params.sourceCurrencyAddress,
            sourceNetwork: String(body.amountIn.chainId),
            targetCurrencyAddress: params.targetCurrencyAddress,
            sourceAmount: body.amountIn.amount,
            targetAmount: body.amountOut.amount,
            rate: String(body.exchangeRate),
            providerId: this.providerId,
            metadata,
        };
    }

    async createDeposit(params: CryptoOnrampDepositParams<SwapsXyzQuoteMetadata>): Promise<CryptoOnrampDeposit> {
        const metadata = params.quote.metadata;
        if (!metadata?.response?.tx?.to) {
            throw new CryptoOnrampError(
                'SwapsXyz: quote metadata is missing — quote must be obtained from this provider',
                CryptoOnrampError.INVALID_PARAMS,
            );
        }

        const { response, recipient } = metadata;

        if (params.userAddress && params.userAddress !== recipient) {
            throw new CryptoOnrampError(
                'SwapsXyz: deposit userAddress does not match the recipient baked into the quote',
                CryptoOnrampError.INVALID_PARAMS,
                { quoteRecipient: recipient, depositUserAddress: params.userAddress },
            );
        }

        if (metadata.sender === this.defaultSender || metadata.sender !== params.refundAddress) {
            if (!isEvmAddress(params.refundAddress)) {
                throw new CryptoOnrampError(
                    'SwapsXyz: senderAddress must be a valid EVM address (got "' + params.refundAddress + '")',
                    CryptoOnrampError.INVALID_REFUND_ADDRESS,
                );
            }

            const newQuote = await this.getQuote({
                amount: params.quote.sourceAmount,
                sourceCurrencyAddress: params.quote.sourceCurrencyAddress,
                sourceNetwork: params.quote.sourceNetwork,
                targetCurrencyAddress: params.quote.targetCurrencyAddress,
                refundAddress: params.refundAddress,
                isSourceAmount: true,
                providerOptions: {
                    recipient: params.userAddress,
                },
            });
            const newMetadata = newQuote.metadata;

            if (!newMetadata) {
                throw new CryptoOnrampError(
                    'SwapsXyz: quote metadata is missing — quote must be obtained from this provider',
                    CryptoOnrampError.INVALID_PARAMS,
                );
            }

            return {
                depositId: newMetadata.response.txId,
                address: newMetadata.response.tx.to,
                amount: newMetadata.response.amountIn.amount,
                sourceCurrencyAddress: params.quote.sourceCurrencyAddress,
                sourceNetwork: String(newMetadata.response.amountIn.chainId),
                providerId: this.providerId,
            };
        }

        return {
            depositId: response.txId,
            address: response.tx.to,
            amount: response.amountIn.amount,
            sourceCurrencyAddress: params.quote.sourceCurrencyAddress,
            sourceNetwork: String(response.amountIn.chainId),
            providerId: this.providerId,
        };
    }

    async getStatus(params: CryptoOnrampStatusParams): Promise<CryptoOnrampStatus> {
        const url = new URL(`${this.apiUrl}/getStatus`);
        url.searchParams.set('txId', params.depositId);

        let response: Response;
        try {
            response = await fetch(url.toString(), {
                method: 'GET',
                headers: { 'x-api-key': this.apiKey },
            });
        } catch (error) {
            throw new CryptoOnrampError(
                'SwapsXyz: network error while calling getAction',
                CryptoOnrampError.QUOTE_FAILED,
                error,
            );
        }

        const body = (await response.json().catch(() => undefined)) as { status: string };

        if (!response.ok || isErrorResponse(body)) {
            const err = isErrorResponse(body) ? body.error : undefined;

            if (isErrorResponse(body) && err?.code === 'NOT_FOUND') {
                return 'pending';
            }

            throw new CryptoOnrampError(
                err?.message ?? `SwapsXyz getAction failed (HTTP ${response.status})`,
                err?.code ?? CryptoOnrampError.QUOTE_FAILED,
                err ?? { status: response.status },
            );
        }

        return mapStatus(body.status);
    }
}
