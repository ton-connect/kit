/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useStakingQuote, useStakedBalance } from '@ton/appkit-react';

export const UseStakingExample = () => {
    // SAMPLE_START: USE_STAKING
    const { data: quote } = useStakingQuote({
        amount: '1000000000',
        direction: 'stake',
    });

    const { data: balance } = useStakedBalance({
        userAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    });

    return (
        <div>
            <div>Staking Quote: {quote?.amountOut}</div>
            <div>Staked Balance: {balance?.stakedBalance}</div>
        </div>
    );
    // SAMPLE_END: USE_STAKING
};
