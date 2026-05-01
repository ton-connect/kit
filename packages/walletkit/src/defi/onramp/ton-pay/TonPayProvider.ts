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

/**
 * Custom options for TonPay requests
 */
export interface TonPayQuoteOptions {
    /**
     * E.g. credit_card, google_pay, apple_pay. Limits the payment methods available.
     */
    paymentMethod?: string;
}

export interface TonPayOnrampOptions {
    /**
     * E.g. dark or light color theme for the widget
     */
    theme?: 'dark' | 'light';
}

/**
 * Provider implementation for TonPay onramp (via pay.ton.org)
 */
export class TonPayProvider extends OnrampProvider<TonPayQuoteOptions, TonPayOnrampOptions> {
    readonly providerId = 'ton-pay';

    getSupportedNetworks(): Network[] {
        return [Network.mainnet()];
    }

    private readonly apiUrl = 'https://pay.ton.org/api/merchant/v1/create-moonpay-transfer';
    private readonly moonpayApiUrl = 'https://api.moonpay.com';

    constructor() {
        super();
    }

    /**
     * TonPay currently acts as a gateway to Moonpay.
     * We can fetch the quote directly from Moonpay's public API for estimation.
     */
    async getQuote(params: OnrampQuoteParams<TonPayQuoteOptions>): Promise<OnrampQuote> {
        try {
            const url = new URL(`${this.moonpayApiUrl}/v3/currencies/${params.cryptoCurrency.toLowerCase()}/buy_quote`);
            url.searchParams.append('apiKey', 'pk_test_J3c52pXIbsTmzwUtYJKQEpKwxuGw8me');
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
            throw new OnrampError('Failed to get TonPay quote', OnrampError.QUOTE_FAILED, error);
        }
    }

    async buildOnrampUrl(params: OnrampParams<TonPayOnrampOptions>): Promise<string> {
        try {
            // Asset — USDT или TON
            const asset = params.quote.cryptoCurrency.toUpperCase();

            const body = {
                asset: asset,
                amount: parseFloat(params.quote.cryptoAmount),
                recipientAddr: params.userAddress,
                userIp: '103.86.37.0', // Standard IP placeholder or we could try to omit it
                directTopUp: true,
            };

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(body),
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`API error: ${response.status} ${errorText}`);
            }

            const data = await response.json();

            if (!data.link) {
                throw new Error('API response missing redirect URL');
            }

            return data.link;
        } catch (error) {
            throw new OnrampError('Failed to build TonPay URL', OnrampError.URL_BUILD_FAILED, error);
        }
    }
}
