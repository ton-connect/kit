/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useNetworks } from '@ton/appkit-react';

export const UseNetworksExample = () => {
    // SAMPLE_START: USE_NETWORKS
    const networks = useNetworks();

    return (
        <div>
            <h3>Available Networks</h3>
            <ul>
                {networks.map((network) => (
                    <li key={network.chainId}>{network.chainId}</li>
                ))}
            </ul>
        </div>
    );
    // SAMPLE_END: USE_NETWORKS
};
