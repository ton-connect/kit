/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SwapQuote } from '@ton/appkit';

import type { SwapInfoRowProps } from '../components/swap-info';

interface GetInfoFromQuoteArgs {
    slippage: number;
    quote?: SwapQuote;
}

export const getInfoFromQuote = ({ quote, slippage }: GetInfoFromQuoteArgs): SwapInfoRowProps[] => {
    const rows: SwapInfoRowProps[] = [];

    if (!quote) return [];

    rows.push({ label: 'Provider', value: quote.providerId });

    if (quote.priceImpact) rows.push({ label: 'Price impact', value: `${(quote.priceImpact / 100).toFixed(2)}%` });

    // rows.push({ label: 'Min received', value: `${quote.minReceived} ${toToken?.symbol ?? ''}` });
    rows.push({ label: 'Slippage', value: `${(slippage / 100).toFixed(2)}%` });

    return rows;
};
