/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Network } from '@ton/appkit';
import { useSwapQuote } from '@ton/appkit-react';

export const UseSwapQuoteExample = () => {
    // SAMPLE_START: USE_SWAP_QUOTE
    const {
        data: quote,
        isLoading,
        error,
    } = useSwapQuote({
        from: { type: 'ton' },
        to: { type: 'jetton', address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs' }, // USDT
        amount: '1000000000', // 1 TON in nanotons (raw format)
        network: Network.mainnet(),
    });

    if (isLoading) {
        return <div>Loading quote...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <div>
            <h3>Swap Quote</h3>
            {quote && (
                <div>
                    <p>Expected Output: {quote.toAmount}</p>
                    <p>Price Impact: {quote.priceImpact}</p>
                </div>
            )}
        </div>
    );
    // SAMPLE_END: USE_SWAP_QUOTE
};
