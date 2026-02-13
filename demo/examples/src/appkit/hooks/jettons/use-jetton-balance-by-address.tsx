/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useJettonBalanceByAddress } from '@ton/appkit-react';

export const UseJettonBalanceByAddressExample = () => {
    // SAMPLE_START: USE_JETTON_BALANCE_BY_ADDRESS
    const {
        data: balance,
        isLoading,
        error,
    } = useJettonBalanceByAddress({
        ownerAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
        jettonAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiXme1Xc56Iwobkzgnjj',
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return <div>Jetton Balance: {balance}</div>;
    // SAMPLE_END: USE_JETTON_BALANCE_BY_ADDRESS
};
