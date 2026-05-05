/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { OnrampParams, OnrampQuote, OnrampQuoteParams } from '../../../api/models';
import { Network } from '../../../api/models';
import { OnrampProvider } from '../OnrampProvider';
import { OnrampError } from '../errors';
import { createProvider } from '../../../types/factory';
import { isAppkitOnrampBuildUrlResponse, isAppkitOnrampGetQuoteResponse } from './utils';

const APPKIT_ONRAMP_PROVIDER_ID = 'appkit-onramp';
const DEFAULT_BASE_URL = 'http://localhost:8090';
const DEFAULT_NETWORK = 'TON';

export interface AppkitOnrampProviderConfig {
    /**
     * Project API key issued by the AppKit Onramp backend (e.g. `ak_test_...`, `ak_live_...`).
     * Sent as a Bearer token. Required.
     */
    apiKey: string;

    /**
     * Override the backend base URL. Defaults to `http://localhost:8090`.
     */
    baseUrl?: string;
}

/**
 * Onramp provider that delegates to the AppKit Onramp backend.
 *
 * A single `getQuote` call returns quotes from every underlying onramp service
 * the backend has configured (MoonPay, etc.). Each returned `OnrampQuote` carries
 * `serviceInfo` describing the underlying service; `buildOnrampUrl` reads
 * `serviceInfo.id` to forward the user's choice back to the backend.
 *
 * @example
 * ```typescript
 * import { createAppkitOnrampProvider } from '@ton/walletkit/onramp/appkit-onramp';
 *
 * kit.onrampManager.registerProvider(
 *     createAppkitOnrampProvider({ apiKey: 'ak_test_...' }),
 * );
 * ```
 */
export class AppkitOnrampProvider extends OnrampProvider<undefined, undefined> {
    readonly providerId = APPKIT_ONRAMP_PROVIDER_ID;

    private readonly apiKey: string;
    private readonly baseUrl: string;

    constructor(config: AppkitOnrampProviderConfig) {
        super();
        if (!config.apiKey) {
            throw new OnrampError('AppkitOnramp: apiKey is required', OnrampError.PROVIDER_ERROR);
        }
        this.apiKey = config.apiKey;
        this.baseUrl = (config.baseUrl ?? DEFAULT_BASE_URL).replace(/\/+$/, '');
    }

    getSupportedNetworks(): Network[] {
        return [Network.mainnet()];
    }

    async getQuote(params: OnrampQuoteParams<undefined>): Promise<OnrampQuote[]> {
        const url = new URL(`${this.baseUrl}/onramp/get-quote`);
        url.searchParams.set('amount', params.amount);
        url.searchParams.set('fiatCurrency', params.fiatCurrency);
        url.searchParams.set('cryptoCurrency', params.cryptoCurrency);
        url.searchParams.set('network', DEFAULT_NETWORK);

        let response: Response;
        try {
            response = await fetch(url.toString(), {
                method: 'GET',
                headers: { Authorization: `Bearer ${this.apiKey}` },
            });
        } catch (error) {
            throw new OnrampError('AppkitOnramp: network error while fetching quotes', OnrampError.QUOTE_FAILED, error);
        }

        if (!response.ok) {
            throw new OnrampError(`AppkitOnramp get-quote failed (HTTP ${response.status})`, OnrampError.QUOTE_FAILED, {
                status: response.status,
            });
        }

        let data: unknown;
        try {
            data = await response.json();
        } catch (error) {
            throw new OnrampError('AppkitOnramp: invalid JSON response', OnrampError.QUOTE_FAILED, error);
        }

        if (!isAppkitOnrampGetQuoteResponse(data)) {
            throw new OnrampError('AppkitOnramp: unexpected get-quote response shape', OnrampError.QUOTE_FAILED, data);
        }

        return data.quotes.map((q) => ({
            fiatCurrency: q.fiatCurrency,
            cryptoCurrency: q.cryptoCurrency,
            fiatAmount: q.fiatAmount,
            cryptoAmount: q.cryptoAmount,
            rate: q.rate,
            fees: q.fees,
            providerId: this.providerId,
            serviceInfo: {
                id: q.providerMetadata.providerId,
                name: q.providerMetadata.name,
                url: q.providerMetadata.url,
                darkLogo: q.providerMetadata.darkLogo,
                lightLogo: q.providerMetadata.lightLogo,
                paymentMethods: q.providerMetadata.paymentMethods,
                supportUrl: q.providerMetadata.supportUrl,
            },
            metadata: q.metadata,
        }));
    }

    async buildOnrampUrl(params: OnrampParams<undefined>): Promise<string> {
        const serviceId = params.quote.serviceInfo?.id;
        if (!serviceId) {
            throw new OnrampError(
                'AppkitOnramp: quote is missing serviceInfo.id — quote must come from this provider',
                OnrampError.URL_BUILD_FAILED,
            );
        }

        const body: Record<string, string> = {
            providerId: serviceId,
            amount: params.quote.fiatAmount,
            fiatCurrency: params.quote.fiatCurrency,
            cryptoCurrency: params.quote.cryptoCurrency,
            network: DEFAULT_NETWORK,
            userAddress: params.userAddress,
        };
        if (params.redirectUrl) {
            body.redirectUrl = params.redirectUrl;
        }

        let response: Response;
        try {
            response = await fetch(`${this.baseUrl}/onramp/build-url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${this.apiKey}`,
                },
                body: JSON.stringify(body),
            });
        } catch (error) {
            throw new OnrampError(
                'AppkitOnramp: network error while building URL',
                OnrampError.URL_BUILD_FAILED,
                error,
            );
        }

        if (!response.ok) {
            throw new OnrampError(
                `AppkitOnramp build-url failed (HTTP ${response.status})`,
                OnrampError.URL_BUILD_FAILED,
                { status: response.status },
            );
        }

        let data: unknown;
        try {
            data = await response.json();
        } catch (error) {
            throw new OnrampError('AppkitOnramp: invalid JSON response', OnrampError.URL_BUILD_FAILED, error);
        }

        if (!isAppkitOnrampBuildUrlResponse(data)) {
            throw new OnrampError(
                'AppkitOnramp: unexpected build-url response shape',
                OnrampError.URL_BUILD_FAILED,
                data,
            );
        }

        return data.url;
    }
}

/**
 * Returns a `ProviderFactory` for `AppkitOnrampProvider`.
 * Pass to `providers: [createAppkitOnrampProvider(config)]`.
 */
export const createAppkitOnrampProvider = (config: AppkitOnrampProviderConfig) =>
    createProvider(() => new AppkitOnrampProvider(config));
