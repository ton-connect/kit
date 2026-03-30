/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useDefaultNetwork, Network } from '@ton/appkit-react';

export const UseDefaultNetworkExample = () => {
    // SAMPLE_START: USE_DEFAULT_NETWORK
    const [defaultNetwork, setDefaultNetwork] = useDefaultNetwork();

    return (
        <div>
            <p>Default network: {defaultNetwork?.chainId ?? 'Any'}</p>
            <button onClick={() => setDefaultNetwork(Network.testnet())}>Use Testnet</button>
            <button onClick={() => setDefaultNetwork(undefined)}>Any Network</button>
        </div>
    );
    // SAMPLE_END: USE_DEFAULT_NETWORK
};
