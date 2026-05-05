/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { OnrampFee } from '../../../api/models';

/**
 * Service metadata as it appears on the wire — mirrors the backend's
 * `ProviderMetadata` Go struct exactly. The `providerId` here is the
 * underlying onramp service id (e.g. `'moonpay'`), not the SDK provider.
 */
export interface AppkitOnrampServiceMetadata {
    providerId: string;
    name: string;
    url: string;
    darkLogo: string;
    lightLogo: string;
    paymentMethods: string[];
    supportUrl: string;
}

/**
 * A quote element returned by the AppKit Onramp `/onramp/get-quote` endpoint.
 * Mirrors the backend's `OnrampQuote` Go struct.
 */
export interface AppkitOnrampQuote {
    fiatCurrency: string;
    cryptoCurrency: string;
    fiatAmount: string;
    cryptoAmount: string;
    rate: string;
    fees: OnrampFee[];
    providerMetadata: AppkitOnrampServiceMetadata;
    metadata?: unknown;
}

export interface AppkitOnrampGetQuoteResponse {
    quotes: AppkitOnrampQuote[];
    providerIds: string[];
}

export interface AppkitOnrampBuildUrlResponse {
    url: string;
}
