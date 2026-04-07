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
        description: 'SEPA, PayPal, Debit Card and other options',
        logo: 'https://images-serviceprovider.meld.io/MOONPAY/short_logo_light.png',
    },
    {
        id: 'transak',
        name: 'Transak',
        description: 'Debit Card, Apple Pay, Google Pay, SEPA',
        logo: 'https://cdn.meld.io/images-serviceprovider/TRANSAK/short_logo_light.png',
    },
    {
        id: 'binance',
        name: 'Binance',
        description: 'Debit Card, Apple Pay, Binance Cash Balance and other options',
        logo: 'https://cdn.meld.io/images-serviceprovider/BINANCECONNECT/short_logo_light.png',
    },
];
