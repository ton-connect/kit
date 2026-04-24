/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useOnrampQuote } from '@ton/appkit-react';

export const UseOnrampQuoteExample = () => {
    // SAMPLE_START: USE_ONRAMP_QUOTE
    const { data: quote, isLoading } = useOnrampQuote({
        fiatCurrency: 'USD',
        cryptoCurrency: 'TON',
        amount: '100',
    });

    if (isLoading) return <div>Loading quote...</div>;
    return <div>Quote: {quote?.cryptoAmount} TON</div>;
    // SAMPLE_END: USE_ONRAMP_QUOTE
};
