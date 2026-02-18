/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useConnectedWallets } from '@ton/appkit-react';

export const UseConnectedWalletsExample = () => {
    // SAMPLE_START: USE_CONNECTED_WALLETS
    const connectedWallets = useConnectedWallets();

    return (
        <div>
            <h3>Connected Wallets:</h3>
            <ul>
                {connectedWallets.map((wallet) => (
                    <li key={wallet.getAddress()}>
                        {wallet.getAddress()} ({wallet.getNetwork().toString()})
                    </li>
                ))}
            </ul>
        </div>
    );
    // SAMPLE_END: USE_CONNECTED_WALLETS
};
