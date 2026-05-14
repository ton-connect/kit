/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useWatchBalance, useBalance } from '@ton/appkit-react';

export const UseWatchBalanceExample = () => {
    // SAMPLE_START: USE_WATCH_BALANCE
    const { data: balance } = useBalance();

    useWatchBalance();

    return <div>Current balance: {balance}</div>;
    // SAMPLE_END: USE_WATCH_BALANCE
};
