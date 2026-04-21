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
} from '../../../api/models';
import { CryptoOnrampProvider } from '../CryptoOnrampProvider';
import { CryptoOnrampError } from '../errors';
import type { SwapsXyzErrorResponse, SwapsXyzGetActionResponse, SwapsXyzSwapDirection } from './types';

const SWAPS_XYZ_API_URL = 'https://api-v2.swaps.xyz/api';
const TON_CHAIN_ID = 999000337;
const DEFAULT_SLIPPAGE_BPS = 100;
/** Any valid checksummed EVM address — swaps.xyz only cares that the field parses. */
const DEFAULT_SENDER = '0x10E06012e8dCE715B471A582da7FA83a018675a3';

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

    /**
     * Override the configured `defaultSender` for this request.
     */
    sender?: string;
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface SwapsXyzDepositOptions {}

/**
 * Metadata stored on the CryptoOnrampQuote returned by this provider.
 *
 * The raw getAction response is kept here so that createDeposit can build a
 * CryptoOnrampDeposit without an extra network round-trip.
 */
export interface SwapsXyzQuoteMetadata {
    recipient: string;
    response: SwapsXyzGetActionResponse;
}

/**
 * Provider implementation that routes crypto onramps through swaps.xyz.
 *
 * Supports EVM source chains only — quotes where the source chain's `vmId`
 * is not `evm` are rejected (non-EVM chains require a separate registerTxs
 * flow that we do not implement yet).
 */
export class SwapsXyzCryptoOnrampProvider extends CryptoOnrampProvider<SwapsXyzQuoteOptions, SwapsXyzDepositOptions> {
    readonly providerId = 'swaps-xyz';

    private readonly apiKey: string;
    private readonly apiUrl: string;
    private readonly defaultSender: string;

    constructor(config: SwapsXyzProviderConfig) {
        super();
        this.apiKey = config.apiKey;
        this.apiUrl = config.apiUrl ?? SWAPS_XYZ_API_URL;
        this.defaultSender = config.defaultSender ?? DEFAULT_SENDER;
    }

    async getQuote(params: CryptoOnrampQuoteParams<SwapsXyzQuoteOptions>): Promise<CryptoOnrampQuote> {
        const recipient = params.providerOptions?.recipient;
        if (!recipient) {
            throw new CryptoOnrampError(
                'SwapsXyz requires a TON recipient address in providerOptions.recipient',
                CryptoOnrampError.InvalidParams,
            );
        }

        const srcChainId = parseChainId(params.sourceNetwork);
        if (srcChainId === undefined) {
            throw new CryptoOnrampError(
                `SwapsXyz: sourceNetwork must be a numeric chainId (got "${params.sourceNetwork}")`,
                CryptoOnrampError.InvalidParams,
            );
        }

        const swapDirection: SwapsXyzSwapDirection =
            params.isSourceAmount === false ? 'exact-amount-out' : 'exact-amount-in';

        const url = new URL(`${this.apiUrl}/getAction`);
        url.searchParams.set('actionType', 'swap-action');
        url.searchParams.set('sender', params.providerOptions?.sender ?? this.defaultSender);
        url.searchParams.set('srcChainId', String(srcChainId));
        url.searchParams.set('srcToken', params.sourceCurrency);
        url.searchParams.set('dstChainId', String(TON_CHAIN_ID));
        url.searchParams.set('dstToken', params.targetCurrency);
        url.searchParams.set('amount', params.amount);
        url.searchParams.set('swapDirection', swapDirection);
        url.searchParams.set('slippage', String(params.providerOptions?.slippageBps ?? DEFAULT_SLIPPAGE_BPS));
        url.searchParams.set('recipient', recipient);
        url.searchParams.set('returnDepositAddress', 'true');

        const response = await this.callGetAction(url);

        if (response.vmId !== 'evm') {
            throw new CryptoOnrampError(
                `SwapsXyz: only EVM source chains are supported (got vmId="${response.vmId}")`,
                CryptoOnrampError.InvalidParams,
                { vmId: response.vmId, srcChainId },
            );
        }

        const metadata: SwapsXyzQuoteMetadata = { recipient, response };

        return {
            sourceCurrency: response.amountIn.symbol,
            sourceNetwork: String(response.amountIn.chainId),
            targetCurrency: response.amountOut.symbol,
            sourceAmount: response.amountIn.amount,
            targetAmount: response.amountOut.amount,
            rate: String(response.exchangeRate),
            providerId: this.providerId,
            metadata,
        };
    }

    async createDeposit(params: CryptoOnrampDepositParams<SwapsXyzDepositOptions>): Promise<CryptoOnrampDeposit> {
        const metadata = params.quote.metadata as SwapsXyzQuoteMetadata | undefined;
        if (!metadata?.response?.tx?.to) {
            throw new CryptoOnrampError(
                'SwapsXyz: quote metadata is missing — quote must be obtained from this provider',
                CryptoOnrampError.InvalidParams,
            );
        }

        const { response, recipient } = metadata;

        if (params.userAddress && params.userAddress !== recipient) {
            throw new CryptoOnrampError(
                'SwapsXyz: deposit userAddress does not match the recipient baked into the quote',
                CryptoOnrampError.InvalidParams,
                { quoteRecipient: recipient, depositUserAddress: params.userAddress },
            );
        }

        return {
            address: response.tx.to,
            amount: response.amountIn.amount,
            sourceCurrency: response.amountIn.symbol,
            sourceNetwork: String(response.amountIn.chainId),
            providerId: this.providerId,
            metadata: {
                txId: response.txId,
                chainKey: response.tx.chainKey,
                value: response.tx.value,
                bridgeIds: response.bridgeIds,
                estimatedTxTime: response.estimatedTxTime,
            },
        };
    }

    private async callGetAction(url: URL): Promise<SwapsXyzGetActionResponse> {
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

        const body = await response.json().catch(() => undefined);

        if (!response.ok || isErrorResponse(body)) {
            const err = isErrorResponse(body) ? body.error : undefined;
            throw new CryptoOnrampError(
                err?.message ?? `SwapsXyz getAction failed (HTTP ${response.status})`,
                err?.code ?? CryptoOnrampError.QUOTE_FAILED,
                err ?? { status: response.status },
            );
        }

        return body as SwapsXyzGetActionResponse;
    }
}

function parseChainId(value: string): number | undefined {
    const n = Number(value);
    return Number.isInteger(n) && n > 0 ? n : undefined;
}

function isErrorResponse(body: unknown): body is SwapsXyzErrorResponse {
    return (
        typeof body === 'object' &&
        body !== null &&
        (body as { success?: unknown }).success === false &&
        typeof (body as { error?: unknown }).error === 'object'
    );
}
