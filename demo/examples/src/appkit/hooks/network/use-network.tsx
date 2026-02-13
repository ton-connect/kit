/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useNetwork } from '@ton/appkit-react';

export const UseNetworkExample = () => {
    // SAMPLE_START: USE_NETWORK
    const network = useNetwork();

    if (!network) {
        return <div>Network not selected</div>;
    }

    return <div>Current Network: {network.chainId}</div>;
    // SAMPLE_END: USE_NETWORK
};
