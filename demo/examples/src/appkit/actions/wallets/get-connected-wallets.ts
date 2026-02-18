/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { getConnectedWallets } from '@ton/appkit';

export const getConnectedWalletsExample = (appKit: AppKit) => {
    // SAMPLE_START: GET_CONNECTED_WALLETS
    const wallets = getConnectedWallets(appKit);

    console.log('Connected wallets:', wallets);
    // SAMPLE_END: GET_CONNECTED_WALLETS
};
