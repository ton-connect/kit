/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getOnrampQuotes } from '@ton/appkit/onramp';

export const getOnrampQuotesExample = async (appKit: AppKit) => {
    // SAMPLE_START: GET_ONRAMP_QUOTES
    const quotes = await getOnrampQuotes(appKit, {
        fiatCurrency: 'USD',
        cryptoCurrency: 'TON',
        amount: '100',
        isFiatAmount: true,
    });
    console.log('Onramp Quotes:', quotes);
    // SAMPLE_END: GET_ONRAMP_QUOTES
};
