/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { watchConnectedWallets } from '@ton/appkit';

export const watchConnectedWalletsExample = (appKit: AppKit) => {
    // SAMPLE_START: WATCH_CONNECTED_WALLETS
    const unsubscribe = watchConnectedWallets(appKit, {
        onChange: (wallets) => {
            console.log('Connected wallets updated:', wallets.length);
        },
    });

    // Later: unsubscribe();
    // SAMPLE_END: WATCH_CONNECTED_WALLETS
    return unsubscribe;
};
