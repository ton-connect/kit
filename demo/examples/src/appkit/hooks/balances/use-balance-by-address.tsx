/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useBalanceByAddress } from '@ton/appkit-react';

export const UseBalanceByAddressExample = () => {
    // SAMPLE_START: USE_BALANCE_BY_ADDRESS
    const {
        data: balance,
        isLoading,
        error,
    } = useBalanceByAddress({
        address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return <div>Balance: {balance?.toString()}</div>;
    // SAMPLE_END: USE_BALANCE_BY_ADDRESS
};
