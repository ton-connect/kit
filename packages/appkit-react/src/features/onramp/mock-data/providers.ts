/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { OnrampProvider } from '../types';

export const ONRAMP_PROVIDERS: OnrampProvider[] = [
    {
        id: 'moonpay',
        name: 'MoonPay',
        description: 'Visa, Mastercard, Apple Pay, Google Pay, SEPA',
    },
    {
        id: 'transak',
        name: 'Transak',
        description: 'Visa, Mastercard, Apple Pay, Google Pay, SEPA',
    },
    {
        id: 'binance',
        name: 'Binance',
        description: 'Visa, Mastercard, Apple Pay, Binance Card',
    },
];
