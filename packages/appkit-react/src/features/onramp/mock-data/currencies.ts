/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { OnrampCurrency } from '../types';

export const ONRAMP_CURRENCIES: OnrampCurrency[] = [
    { code: 'EUR', name: 'Euro', symbol: '\u20AC', flag: 'https://static.moonpay.com/widget/currencies/eur.svg' },
    { code: 'USD', name: 'US Dollar', symbol: '$', flag: 'https://static.moonpay.com/widget/currencies/usd.svg' },
    {
        code: 'GBP',
        name: 'Pound Sterling',
        symbol: '\u00A3',
        flag: 'https://static.moonpay.com/widget/currencies/gbp.svg',
    },
];
