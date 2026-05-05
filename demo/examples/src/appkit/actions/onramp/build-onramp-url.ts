/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { buildOnrampUrl, getOnrampQuotes } from '@ton/appkit/onramp';

export const buildOnrampUrlExample = async (appKit: AppKit) => {
    // SAMPLE_START: BUILD_ONRAMP_URL
    const quotes = await getOnrampQuotes(appKit, {
        fiatCurrency: 'USD',
        cryptoCurrency: 'TON',
        amount: '100',
    });

    const [quote] = quotes;
    if (!quote) throw new Error('No onramp quotes available');

    const url = await buildOnrampUrl(appKit, {
        quote,
        userAddress: 'UQ...wallet-address...',
    });
    console.log('Onramp URL:', url);
    // SAMPLE_END: BUILD_ONRAMP_URL
};
