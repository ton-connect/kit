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

import { useJettonInfo } from '@ton/appkit-react';

export const UseJettonInfoExample = () => {
    // SAMPLE_START: USE_JETTON_INFO
    const {
        data: info,
        isLoading,
        error,
    } = useJettonInfo({
        address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiXme1Xc56Iwobkzgnjj',
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <div>
            <h3>Jetton Info</h3>
            <p>Name: {info?.name}</p>
            <p>Symbol: {info?.symbol}</p>
            <p>Decimals: {info?.decimals}</p>
        </div>
    );
    // SAMPLE_END: USE_JETTON_INFO
};
