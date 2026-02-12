/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getNetworks } from '@ton/appkit';

export const getNetworksExample = (appKit: AppKit) => {
    // SAMPLE_START: GET_NETWORKS
    const networks = getNetworks(appKit);

    console.log('Configured networks:', networks);
    // SAMPLE_END: GET_NETWORKS
};
