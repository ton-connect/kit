/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useStakingQuote } from '@ton/appkit-react';

export const UseStakingQuoteExample = () => {
    // SAMPLE_START: USE_STAKING_QUOTE
    const {
        data: quote,
        isLoading,
        error,
    } = useStakingQuote({
        amount: '10',
        direction: 'stake',
    });

    if (isLoading) return <div>Loading quote...</div>;
    if (error) return <div>Error: {error.message}</div>;

    return <div>Expected Output: {quote?.amountOut}</div>;
    // SAMPLE_END: USE_STAKING_QUOTE
};
