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

import { useJettonsByAddress } from '@ton/appkit-react';

export const UseJettonsByAddressExample = () => {
    // SAMPLE_START: USE_JETTONS_BY_ADDRESS
    const {
        data: jettons,
        isLoading,
        error,
    } = useJettonsByAddress({
        address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
    });

    if (isLoading) {
        return <div>Loading...</div>;
    }

    if (error) {
        return <div>Error: {error.message}</div>;
    }

    return (
        <div>
            <h3>Jettons</h3>
            <ul>
                {jettons?.jettons.map((jetton) => (
                    <li key={jetton.walletAddress}>
                        {jetton.info.name}: {jetton.balance}
                    </li>
                ))}
            </ul>
        </div>
    );
    // SAMPLE_END: USE_JETTONS_BY_ADDRESS
};
