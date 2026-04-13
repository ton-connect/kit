/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface OnrampCurrency {
    id: string;
    code: string;
    name: string;
    symbol?: string;
    logo?: string;
}

export interface OnrampProvider {
    id: string;
    name: string;
    description?: string;
    logo?: string;
}

export interface CurrencySectionConfig {
    title: string;
    ids: string[];
}

export type AmountInputMode = 'token' | 'currency';

export interface OnrampAmountPreset {
    amount: string;
    label: string;
}

export interface CryptoPaymentMethod {
    id: string;
    /** Token symbol, e.g. "BTC", "USDT" */
    symbol: string;
    /** Token name, e.g. "Bitcoin", "Tether" */
    name: string;
    /** Human-readable network name, e.g. "Tron", "Ethereum", "Bitcoin" */
    network: string;
    /** Network id used for filter tabs, e.g. "tron", "ethereum" */
    networkId: string;
    logo?: string;
    networkLogo?: string;
    /** Mock deposit address for this method */
    depositAddress?: string;
}

export interface PaymentMethodSectionConfig {
    title: string;
    ids: string[];
}
