/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getNetwork } from '@ton/appkit';

export const getNetworkExample = (appKit: AppKit) => {
    // SAMPLE_START: GET_NETWORK
    const network = getNetwork(appKit);

    if (network) {
        console.log('Current network:', network);
    }
    // SAMPLE_END: GET_NETWORK
};
