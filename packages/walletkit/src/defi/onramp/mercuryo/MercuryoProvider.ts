/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { OnrampParams, OnrampQuote, OnrampQuoteParams } from '../../../api/models/onramps';
import { OnrampProvider } from '../OnrampProvider';
import { OnrampError } from '../errors';

/**
 * Custom options for Mercuryo requests
 */
export interface MercuryoQuoteOptions {
    /**
     * E.g. credit_card, bank_transfer. Limits the payment methods available.
     * Often not strictly required by convert endpoint but can be passed.
     */
    paymentMethod?: string;
}

export interface MercuryoOnrampOptions {
    /**
     * E.g. The exact widget ID assigned by Mercuryo to the partner
     */
    widgetId?: string;

    /**
     * E.g. The user's email to pre-fill the widget
     */
    merchantUserEmail?: string;
}

/**
 * Provider implementation for Mercuryo onramp
 */
export class MercuryoProvider extends OnrampProvider<MercuryoQuoteOptions, MercuryoOnrampOptions> {
    readonly providerId = 'mercuryo';

    private readonly baseUrl = 'https://exchange.mercuryo.io/';
    private readonly apiUrl = 'https://api.mercuryo.io/v1.6';

    /**
     * Optional default widget ID
     */
    private readonly widgetId?: string;

    constructor(widgetId?: string) {
        super();
        this.widgetId = widgetId;
    }

    async getQuote(params: OnrampQuoteParams<MercuryoQuoteOptions>): Promise<OnrampQuote> {
        try {
            // Amount string validation
            const amount = parseFloat(params.amount);
            if (isNaN(amount) || amount <= 0) {
                throw new Error('Invalid amount');
            }

            const url = new URL(`${this.apiUrl}/widget/buy/rate`);

            url.searchParams.append('fiat_currency', params.fiatCurrency.toUpperCase());
            url.searchParams.append('currency', params.cryptoCurrency.toUpperCase());
            url.searchParams.append('amount', params.amount);

            if (this.widgetId) {
                url.searchParams.append('widget_id', this.widgetId);
            }

            if (params.providerOptions?.paymentMethod) {
                url.searchParams.append('payment_method', params.providerOptions.paymentMethod);
            }

            const response = await fetch(url.toString());
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (!data.data) {
                throw new Error('No quote data returned');
            }

            return {
                fiatCurrency: params.fiatCurrency,
                cryptoCurrency: params.cryptoCurrency,
                fiatAmount: params.amount,
                cryptoAmount: data.data.amount.toString(),
                rate: data.data.rate.toString(),
                fiatFee: data.data.fee ? data.data.fee.toString() : '0',
                providerId: this.providerId,
                metadata: data.data,
            };
        } catch (error) {
            throw new OnrampError('Failed to get Mercuryo quote', OnrampError.QUOTE_FAILED, error);
        }
    }

    async buildOnrampUrl(params: OnrampParams<MercuryoOnrampOptions>): Promise<string> {
        try {
            const url = new URL(this.baseUrl);
            const activeWidgetId = params.providerOptions?.widgetId || this.widgetId;

            if (activeWidgetId) {
                url.searchParams.append('widget_id', activeWidgetId);
            }

            // Prefill with user address
            if (params.userAddress) {
                url.searchParams.append('address', params.userAddress);
            }

            if (params.providerOptions?.merchantUserEmail) {
                url.searchParams.append('merchant_user_email', params.providerOptions.merchantUserEmail);
            }

            // Apply quote details
            url.searchParams.append('fiat_currency', params.quote.fiatCurrency.toUpperCase());
            url.searchParams.append('fiat_amount', params.quote.fiatAmount);
            url.searchParams.append('currency', params.quote.cryptoCurrency.toUpperCase());

            if (params.redirectUrl) {
                url.searchParams.append('return_url', params.redirectUrl);
            }

            return url.toString();
        } catch (error) {
            throw new OnrampError('Failed to build Mercuryo URL', OnrampError.URL_BUILD_FAILED, error);
        }
    }
}
