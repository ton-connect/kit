/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { setDefaultNetwork, Network } from '@ton/appkit';

export const setDefaultNetworkExample = (appKit: AppKit) => {
    // SAMPLE_START: SET_DEFAULT_NETWORK
    // Enforce testnet for all new wallet connections
    setDefaultNetwork(appKit, { network: Network.testnet() });

    // Allow any network (clear default)
    setDefaultNetwork(appKit, { network: undefined });
    // SAMPLE_END: SET_DEFAULT_NETWORK
};
