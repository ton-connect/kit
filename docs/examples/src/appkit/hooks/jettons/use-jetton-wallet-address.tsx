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

import { useJettonWalletAddress } from '@ton/appkit-react';

export const UseJettonWalletAddressExample = () => {
    // SAMPLE_START: USE_JETTON_WALLET_ADDRESS
    const {
        data: walletAddress,
        isLoading,
        error,
    } = useJettonWalletAddress({
        ownerAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
        jettonAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiXme1Xc56Iwobkzgnjj',
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return <div>Jetton Wallet Address: {walletAddress?.toString()}</div>;
    // SAMPLE_END: USE_JETTON_WALLET_ADDRESS
};
