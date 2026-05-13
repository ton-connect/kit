/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-console */

import { CurrencyItem } from '@ton/appkit-react';

export const CurrencyItemExample = () => {
    // SAMPLE_START: CURRENCY_ITEM
    // Top-level props give you the default layout in one line.
    return (
        <CurrencyItem
            ticker="USDT"
            name="Tether USD"
            icon="https://cdn.example.com/usdt.png"
            balance="1,234.56"
            underBalance="≈ $1,234.56"
            isVerified
            onClick={() => console.log('Picked USDT')}
        />
    );
    // SAMPLE_END: CURRENCY_ITEM
};
