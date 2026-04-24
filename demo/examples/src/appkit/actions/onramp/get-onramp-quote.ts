/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getOnrampQuote } from '@ton/appkit';

export const getOnrampQuoteExample = async (appKit: AppKit) => {
    // SAMPLE_START: GET_ONRAMP_QUOTE
    const quote = await getOnrampQuote(appKit, {
        fiatCurrency: 'USD',
        cryptoCurrency: 'TON',
        amount: '100',
        isFiatAmount: true,
    });
    console.log('Onramp Quote:', quote);
    // SAMPLE_END: GET_ONRAMP_QUOTE
};
