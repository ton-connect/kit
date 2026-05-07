/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { watchNetworks } from '@ton/appkit';

export const watchNetworksExample = (appKit: AppKit) => {
    // SAMPLE_START: WATCH_NETWORKS
    const unsubscribe = watchNetworks(appKit, {
        onChange: (networks) => {
            console.log('Networks updated:', networks);
        },
    });

    // Later: unsubscribe();
    // SAMPLE_END: WATCH_NETWORKS
    return unsubscribe;
};
