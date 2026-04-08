/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { OnrampCurrency } from '../types';

export const ONRAMP_CURRENCIES: OnrampCurrency[] = [
    {
        id: 'eur',
        code: 'EUR',
        name: 'Euro',
        symbol: '\u20AC',
        logo: 'https://static.moonpay.com/widget/currencies/eur.svg',
    },
    {
        id: 'usd',
        code: 'USD',
        name: 'US Dollar',
        symbol: '$',
        logo: 'https://static.moonpay.com/widget/currencies/usd.svg',
    },
    {
        id: 'gbp',
        code: 'GBP',
        name: 'Pound Sterling',
        symbol: '\u00A3',
        logo: 'https://static.moonpay.com/widget/currencies/gbp.svg',
    },
];
