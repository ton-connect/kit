/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    OnrampParams,
    OnrampQuote,
    OnrampQuoteParams,
    OnrampLimits,
    OnrampLimitParams,
    OnrampTransactionStatus,
    OnrampTransactionParams,
    OnrampStatus,
} from '../../../api/models/onramps';
import { OnrampProvider } from '../OnrampProvider';
import { OnrampError } from '../errors';

/**
 * Custom options for Moonpay requests
 */
export interface MoonpayQuoteOptions {
    /**
     * E.g. credit_card, google_pay, apple_pay. Limits the payment methods available.
     */
    paymentMethod?: string;
}

export interface MoonpayOnrampOptions {
    /**
     * E.g. dark or light color theme for the widget
     */
    theme?: 'dark' | 'light';

    /**
     * The URL to redirect to after successful payment
     */
    redirectUrl?: string;
}

/**
 * Provider implementation for Moonpay onramp
 *
 * Note: Moonpay relies heavily on widget redirects. Quotes are typically estimates
 * and the final price is confirmed on the Moonpay widget.
 */
export class MoonpayProvider extends OnrampProvider<MoonpayQuoteOptions, MoonpayOnrampOptions, undefined, undefined> {
    readonly providerId = 'moonpay';

    private readonly baseUrl = 'https://buy.moonpay.com';
    private readonly apiUrl = 'https://api.moonpay.com';
    private readonly apiKey: string;

    constructor(apiKey: string) {
        super();
        if (!apiKey) {
            throw new OnrampError('Moonpay API key is required', OnrampError.PROVIDER_ERROR);
        }
        this.apiKey = apiKey;
    }

    /**
     * Note: Moonpay's public API for quotes often requires server-side integration heavily.
     * Often, wallets just use the URL generator and let Moonpay show the quote in the widget.
     * We provide a mocked/base implementation here, you may need a server-to-server
     * call to Moonpay's API to get an accurate quote without the widget.
     */
    async getQuote(params: OnrampQuoteParams<MoonpayQuoteOptions>): Promise<OnrampQuote> {
        try {
            const url = new URL(`${this.apiUrl}/v3/currencies/${params.cryptoCurrency.toLowerCase()}/buy_quote`);
            url.searchParams.append('apiKey', this.apiKey);
            url.searchParams.append('baseCurrencyCode', params.fiatCurrency.toLowerCase());
            url.searchParams.append('baseCurrencyAmount', params.amount);

            if (params.providerOptions?.paymentMethod) {
                url.searchParams.append('paymentMethod', params.providerOptions.paymentMethod);
            }

            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            return {
                fiatCurrency: params.fiatCurrency,
                cryptoCurrency: params.cryptoCurrency,
                fiatAmount: params.amount,
                cryptoAmount: data.quoteCurrencyAmount.toString(),
                rate: data.quoteCurrencyPrice.toString(),
                fiatFee: data.feeAmount.toString(),
                networkFeeFiat: data.networkFeeAmount.toString(),
                providerId: this.providerId,
                metadata: data,
            };
        } catch (error) {
            throw new OnrampError('Failed to get Moonpay quote', OnrampError.QUOTE_FAILED, error);
        }
    }

    async getLimits(params: OnrampLimitParams<undefined>): Promise<OnrampLimits> {
        try {
            const url = new URL(`${this.apiUrl}/v3/currencies/${params.cryptoCurrency.toLowerCase()}/limits`);
            url.searchParams.append('apiKey', this.apiKey);
            url.searchParams.append('baseCurrencyCode', params.fiatCurrency.toLowerCase());

            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Moonpay limits format validation
            if (!data.baseCurrency || typeof data.baseCurrency.minBuyAmount !== 'number') {
                throw new Error('No limits returned from provider');
            }

            return {
                minBaseAmount: data.baseCurrency.minBuyAmount,
                maxBaseAmount: data.baseCurrency.maxBuyAmount,
                providerId: this.providerId,
            };
        } catch (error) {
            throw new OnrampError('Failed to get Moonpay limits', OnrampError.PROVIDER_ERROR, error);
        }
    }

    async getTransactionStatus(params: OnrampTransactionParams<undefined>): Promise<OnrampTransactionStatus> {
        try {
            const url = new URL(`${this.apiUrl}/v1/transactions/${params.transactionId}`);
            url.searchParams.append('apiKey', this.apiKey);

            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            let normalizedStatus: OnrampStatus = 'unknown';
            switch (data.status) {
                case 'pending':
                case 'waitingPayment':
                    normalizedStatus = 'pending';
                    break;
                case 'completed':
                    normalizedStatus = 'completed';
                    break;
                case 'failed':
                    normalizedStatus = 'failed';
                    break;
            }

            return {
                status: normalizedStatus,
                rawStatus: data.status,
                transactionId: data.id,
                fiatCurrency: data.baseCurrency.code,
                fiatAmount: data.baseCurrencyAmount.toString(),
                cryptoCurrency: data.currency.code,
                txHash: data.cryptoTransactionId,
                walletAddress: data.walletAddress,
                providerId: this.providerId,
            };
        } catch (error) {
            throw new OnrampError('Failed to get Moonpay transaction status', OnrampError.PROVIDER_ERROR, error);
        }
    }

    async buildOnrampUrl(params: OnrampParams<MoonpayOnrampOptions>): Promise<string> {
        try {
            const url = new URL(this.baseUrl);

            url.searchParams.append('apiKey', this.apiKey);
            url.searchParams.append('walletAddress', params.userAddress);

            // If we have a quote, we can prefill amounts and currencies
            if (params.quote) {
                // Moonpay expects lowercase currency codes
                url.searchParams.append('currencyCode', params.quote.cryptoCurrency.toLowerCase());
                url.searchParams.append('baseCurrencyCode', params.quote.fiatCurrency.toLowerCase());
                url.searchParams.append('baseCurrencyAmount', params.quote.fiatAmount);
            } else {
                // Default to TON if no quote is provided
                url.searchParams.append('currencyCode', 'ton');
            }

            // Apply specific provider options
            if (params.providerOptions?.theme) {
                url.searchParams.append('theme', params.providerOptions.theme);
            }

            if (params.providerOptions?.redirectUrl) {
                url.searchParams.append('redirectURL', params.providerOptions.redirectUrl);
            }

            return url.toString();
        } catch (error) {
            throw new OnrampError('Failed to build Moonpay URL', OnrampError.URL_BUILD_FAILED, error);
        }
    }
}
