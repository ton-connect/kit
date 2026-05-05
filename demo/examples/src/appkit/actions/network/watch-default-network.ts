/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { watchDefaultNetwork } from '@ton/appkit';

export const watchDefaultNetworkExample = (appKit: AppKit) => {
    // SAMPLE_START: WATCH_DEFAULT_NETWORK
    const unsubscribe = watchDefaultNetwork(appKit, {
        onChange: (network) => {
            console.log('Default network changed:', network);
        },
    });

    // Later: unsubscribe();
    // SAMPLE_END: WATCH_DEFAULT_NETWORK
    return unsubscribe;
};
