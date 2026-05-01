/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useStakedBalance } from '@ton/appkit-react';

export const UseStakedBalanceExample = () => {
    // SAMPLE_START: USE_STAKED_BALANCE
    const { data: balance, isLoading } = useStakedBalance({
        userAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    });

    if (isLoading) return <div>Loading balance...</div>;

    return <div>Staked Balance: {balance?.stakedBalance}</div>;
    // SAMPLE_END: USE_STAKED_BALANCE
};
