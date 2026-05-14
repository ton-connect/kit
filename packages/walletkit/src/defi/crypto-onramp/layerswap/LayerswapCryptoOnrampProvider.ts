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
import { CryptoOnrampError, CryptoOnrampErrorCode } from '../errors';
import { createProvider } from '../../../types/factory';
import type { LayerswapCreateSwapResponse, LayerswapGetSwapResponse } from './types';
import {
    ARBITRUM_CAIP2,
    ARBITRUM_USDT0_ADDRESS,
    LAYERSWAP_DESTINATION_NETWORK,
    LAYERSWAP_DESTINATION_TOKEN,
    LAYERSWAP_SOURCE_NETWORK,
    LAYERSWAP_SOURCE_TOKEN,
    TON_USDT_ADDRESS,
    formatBaseUnits,
    isErrorResponse,
    mapStatus,
    parseBaseUnits,
} from './utils';

const LAYERSWAP_API_URL = 'https://api.layerswap.io/api/v2';
const SOURCE_TOKEN_DECIMALS = 6;
const DESTINATION_TOKEN_DECIMALS = 6;

export interface LayerswapProviderConfig {
    /**
     * Optional API key. Forwarded as `X-LS-APIKEY` when provided.
     */
    apiKey?: string;

    /**
     * Override the base API URL. Defaults to https://api.layerswap.io/api/v2
     */
    apiUrl?: string;
}

/**
 * Metadata stored on the CryptoOnrampQuote returned by this provider.
 *
 * The swap is created at quote time, so we cache the swap id and deposit
 * action here; `createDeposit` just reads them out.
 */
export interface LayerswapQuoteMetadata {
    swapId: string;
    depositAddress: string;
    sourceAmountBaseUnits: string;
    targetAmountBaseUnits: string;
}

/**
 * Provider implementation that routes crypto onramps through Layerswap.
 *
 * v1 only supports a single hard-coded route: Arbitrum USDT0 → TON USDT.
 * Any other source network / token combination is rejected.
 */
export class LayerswapCryptoOnrampProvider extends CryptoOnrampProvider<undefined, LayerswapQuoteMetadata> {
    readonly providerId = 'layerswap';

    getSupportedNetworks(): Network[] {
        return [Network.mainnet()];
    }

    getMetadata() {
        return { name: 'Layerswap', url: 'https://layerswap.io', isReversedAmountSupported: false };
    }

    private readonly apiKey: string | undefined;
    private readonly apiUrl: string;

    constructor(config: LayerswapProviderConfig = {}) {
        super();
        this.apiKey = config.apiKey;
        this.apiUrl = config.apiUrl ?? LAYERSWAP_API_URL;
    }

    async getQuote(params: CryptoOnrampQuoteParams<undefined>): Promise<CryptoOnrampQuote<LayerswapQuoteMetadata>> {
        const recipient = params.recipientAddress;

        if (params.sourceChain !== ARBITRUM_CAIP2) {
            throw new CryptoOnrampError(
                `Layerswap: unsupported source chain "${params.sourceChain}" (only Arbitrum One / ${ARBITRUM_CAIP2} is supported)`,
                CryptoOnrampErrorCode.InvalidParams,
            );
        }

        if (params.sourceCurrencyAddress.toLowerCase() !== ARBITRUM_USDT0_ADDRESS) {
            throw new CryptoOnrampError(
                `Layerswap: unsupported source token "${params.sourceCurrencyAddress}" (only USDT0 on Arbitrum is supported)`,
                CryptoOnrampErrorCode.InvalidParams,
            );
        }

        if (params.targetCurrencyAddress !== TON_USDT_ADDRESS) {
            throw new CryptoOnrampError(
                `Layerswap: unsupported target token "${params.targetCurrencyAddress}" (only USDT on TON is supported)`,
                CryptoOnrampErrorCode.InvalidParams,
            );
        }

        if (params.isSourceAmount === false) {
            throw new CryptoOnrampError(
                'Layerswap: only source-amount quotes are supported',
                CryptoOnrampErrorCode.ReversedAmountNotSupported,
            );
        }

        const amountDecimal = formatBaseUnits(params.amount, SOURCE_TOKEN_DECIMALS);

        const body = {
            amount: amountDecimal,
            source_network: LAYERSWAP_SOURCE_NETWORK,
            destination_network: LAYERSWAP_DESTINATION_NETWORK,
            source_token: LAYERSWAP_SOURCE_TOKEN,
            destination_token: LAYERSWAP_DESTINATION_TOKEN,
            destination_address: recipient,
            refuel: false,
            use_deposit_address: true,
        };

        let response: Response;
        try {
            response = await fetch(`${this.apiUrl}/swaps`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...(this.apiKey ? { 'X-LS-APIKEY': this.apiKey } : {}),
                },
                body: JSON.stringify(body),
            });
        } catch (error) {
            throw new CryptoOnrampError(
                'Layerswap: network error while creating swap',
                CryptoOnrampErrorCode.QuoteFailed,
                error,
            );
        }

        const json = (await response.json().catch(() => undefined)) as LayerswapCreateSwapResponse | undefined;

        if (!response.ok || !json || isErrorResponse(json)) {
            const err = isErrorResponse(json) ? json.error : undefined;
            throw new CryptoOnrampError(
                err?.message ?? `Layerswap create swap failed (HTTP ${response.status})`,
                (err?.code as CryptoOnrampErrorCode) ?? CryptoOnrampErrorCode.QuoteFailed,
                err ?? { status: response.status },
            );
        }

        const data = json.data;
        const depositAction = data.deposit_actions[0];
        if (!depositAction) {
            throw new CryptoOnrampError(
                'Layerswap: swap was created but no deposit action was returned',
                CryptoOnrampErrorCode.QuoteFailed,
                data,
            );
        }

        const targetAmountBaseUnits = parseBaseUnits(data.quote.receive_amount, DESTINATION_TOKEN_DECIMALS);
        const rate =
            data.quote.requested_amount > 0
                ? (data.quote.receive_amount / data.quote.requested_amount).toString()
                : '0';

        const metadata: LayerswapQuoteMetadata = {
            swapId: data.swap.id,
            depositAddress: depositAction.to_address,
            sourceAmountBaseUnits: depositAction.amount_in_base_units,
            targetAmountBaseUnits,
        };

        return {
            sourceCurrencyAddress: params.sourceCurrencyAddress,
            sourceChain: ARBITRUM_CAIP2,
            targetCurrencyAddress: params.targetCurrencyAddress,
            sourceAmount: metadata.sourceAmountBaseUnits,
            targetAmount: metadata.targetAmountBaseUnits,
            rate,
            recipientAddress: recipient,
            providerId: this.providerId,
            metadata,
        };
    }

    async createDeposit(params: CryptoOnrampDepositParams<LayerswapQuoteMetadata>): Promise<CryptoOnrampDeposit> {
        const metadata = params.quote.metadata;
        if (!metadata?.swapId) {
            throw new CryptoOnrampError(
                'Layerswap: quote metadata is missing — quote must be obtained from this provider',
                CryptoOnrampErrorCode.InvalidParams,
            );
        }

        return {
            depositId: metadata.swapId,
            address: metadata.depositAddress,
            amount: metadata.sourceAmountBaseUnits,
            sourceCurrencyAddress: params.quote.sourceCurrencyAddress,
            sourceChain: params.quote.sourceChain,
            providerId: this.providerId,
        };
    }

    async getStatus(params: CryptoOnrampStatusParams): Promise<CryptoOnrampStatus> {
        const url = new URL(`${this.apiUrl}/swaps/${params.depositId}`);
        url.searchParams.set('exclude_deposit_actions', 'true');

        let response: Response;
        try {
            response = await fetch(url.toString(), {
                method: 'GET',
                headers: this.apiKey ? { 'X-LS-APIKEY': this.apiKey } : undefined,
            });
        } catch (error) {
            throw new CryptoOnrampError(
                'Layerswap: network error while fetching swap status',
                CryptoOnrampErrorCode.ProviderError,
                error,
            );
        }

        if (response.status === 404) {
            return 'pending';
        }

        const json = (await response.json().catch(() => undefined)) as LayerswapGetSwapResponse | undefined;

        if (!response.ok || !json || isErrorResponse(json)) {
            const err = isErrorResponse(json) ? json.error : undefined;
            throw new CryptoOnrampError(
                err?.message ?? `Layerswap get swap failed (HTTP ${response.status})`,
                (err?.code as CryptoOnrampErrorCode) ?? CryptoOnrampErrorCode.ProviderError,
                err ?? { status: response.status },
            );
        }

        return mapStatus(json.data.swap.status);
    }
}

/**
 * Returns a `ProviderFactory` for `LayerswapCryptoOnrampProvider`.
 * Pass to `providers: [createLayerswapProvider(config)]`.
 */
export const createLayerswapProvider = (config: LayerswapProviderConfig = {}) =>
    createProvider(() => new LayerswapCryptoOnrampProvider(config));
