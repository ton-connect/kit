/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useWatchJettonsByAddress, useJettonsByAddress } from '@ton/appkit-react';

export const UseWatchJettonsByAddressExample = () => {
    // SAMPLE_START: USE_WATCH_JETTONS_BY_ADDRESS
    const address = 'UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ';
    const { data: jettons } = useJettonsByAddress({ address });

    useWatchJettonsByAddress({ address });

    return (
        <div>
            <h3>Jettons for {address}:</h3>
            <ul>
                {jettons?.jettons.map((j) => (
                    <li key={j.walletAddress}>
                        {j.info.name}: {j.balance}
                    </li>
                ))}
            </ul>
        </div>
    );
    // SAMPLE_END: USE_WATCH_JETTONS_BY_ADDRESS
};
