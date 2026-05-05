/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useWatchJettons, useJettons } from '@ton/appkit-react';

export const UseWatchJettonsExample = () => {
    // SAMPLE_START: USE_WATCH_JETTONS
    const { data: jettons } = useJettons();

    useWatchJettons();

    return (
        <div>
            <h3>Your Jettons:</h3>
            <ul>
                {jettons?.jettons.map((j) => (
                    <li key={j.walletAddress}>
                        {j.info.name}: {j.balance}
                    </li>
                ))}
            </ul>
        </div>
    );
    // SAMPLE_END: USE_WATCH_JETTONS
};
