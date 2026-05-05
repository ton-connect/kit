/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Static info describing an underlying fiat onramp service
 * (e.g. MoonPay, Mercuryo) attached to a quote.
 *
 * Distinct from the SDK-level onramp provider: a single registered provider
 * (e.g. AppkitOnramp) may surface quotes from many services.
 */
export interface OnrampServiceInfo {
    id: string;
    name: string;
    url: string;
    darkLogo: string;
    lightLogo: string;
    paymentMethods: string[];
    supportUrl: string;
}
