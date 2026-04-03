/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SwapQuote, SwapProvider } from '@ton/appkit';
import { formatLargeValue } from '@ton/appkit';

import type { SwapInfoRowProps } from '../components/swap-info';
import type { AppkitUIToken } from '../../../types/appkit-ui-token';

interface GetInfoFromQuoteArgs {
    slippage: number;
    toToken: AppkitUIToken | null;
    quote?: SwapQuote;
    provider?: SwapProvider;
}

export const getInfoFromQuote = ({ quote, slippage, provider, toToken }: GetInfoFromQuoteArgs): SwapInfoRowProps[] => {
    const rows: SwapInfoRowProps[] = [];

    if (!quote) return [];

    if (provider) {
        const metadata = provider.getMetadata();
        rows.push({ label: 'Provider', value: metadata.name });
    }

    if (quote.priceImpact) rows.push({ label: 'Price impact', value: `${(quote.priceImpact / 100).toFixed(2)}%` });

    if (toToken) {
        rows.push({
            label: 'Min received',
            value: `${formatLargeValue(quote.minReceived, Math.min(toToken.decimals, 6))} ${toToken.symbol}`,
        });
    }

    rows.push({ label: 'Slippage', value: `${(slippage / 100).toFixed(2)}%` });

    return rows;
};
