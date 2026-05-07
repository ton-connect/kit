/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useBalance } from '@ton/appkit-react';

export const UseBalanceExample = () => {
    // SAMPLE_START: USE_BALANCE
    const { data: balance, isLoading, error } = useBalance();

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return <div>Balance: {balance?.toString()}</div>;
    // SAMPLE_END: USE_BALANCE
};
