/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useStakingContext } from '@ton/appkit-react';

export const UseStakingContextExample = () => {
    // SAMPLE_START: USE_STAKING_CONTEXT
    const { amount, setAmount, quote, isQuoteLoading, canSubmit, sendTransaction } = useStakingContext();

    return (
        <div>
            <input value={amount} onChange={(e) => setAmount(e.target.value)} />
            {isQuoteLoading && <span>Loading...</span>}
            <button disabled={!canSubmit} onClick={sendTransaction}>
                Stake {quote?.amountOut}
            </button>
        </div>
    );
    // SAMPLE_END: USE_STAKING_CONTEXT
};
