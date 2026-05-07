/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useAddress } from '@ton/appkit-react';

export const UseAddressExample = () => {
    // SAMPLE_START: USE_ADDRESS
    const address = useAddress();

    if (!address) {
        return <div>Wallet not connected</div>;
    }

    return <div>Current Address: {address}</div>;
    // SAMPLE_END: USE_ADDRESS
};
