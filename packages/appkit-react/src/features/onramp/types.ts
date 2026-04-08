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
