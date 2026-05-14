/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getDefaultNetwork } from '@ton/appkit';

export const getDefaultNetworkExample = (appKit: AppKit) => {
    // SAMPLE_START: GET_DEFAULT_NETWORK
    const defaultNetwork = getDefaultNetwork(appKit);
    console.log('Default network:', defaultNetwork);
    // SAMPLE_END: GET_DEFAULT_NETWORK
};
