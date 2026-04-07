/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export interface OnrampCurrency {
    code: string;
    name: string;
    symbol: string;
    flag?: string;
}

export interface OnrampProvider {
    id: string;
    name: string;
    description?: string;
    logo?: string;
}

export type AmountInputMode = 'token' | 'currency';
