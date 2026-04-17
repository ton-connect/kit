/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useSwapContext } from '@ton/appkit-react';

export const UseSwapContextExample = () => {
    // SAMPLE_START: USE_SWAP_CONTEXT
    const { fromAmount, setFromAmount, toAmount, isQuoteLoading, canSubmit, sendSwapTransaction } = useSwapContext();

    return (
        <div>
            <input value={fromAmount} onChange={(e) => setFromAmount(e.target.value)} placeholder="Amount to swap" />
            {isQuoteLoading && <div>Fetching best price...</div>}
            <button disabled={!canSubmit || isQuoteLoading} onClick={sendSwapTransaction}>
                Swap for {toAmount}
            </button>
        </div>
    );
    // SAMPLE_END: USE_SWAP_CONTEXT
};
