/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { watchConnectors } from '@ton/appkit';

export const watchConnectorsExample = (appKit: AppKit) => {
    // SAMPLE_START: WATCH_CONNECTORS
    const unsubscribe = watchConnectors(appKit, {
        onChange: (connectors) => {
            console.log('Connectors updated:', connectors);
        },
    });

    // Later: unsubscribe();
    // SAMPLE_END: WATCH_CONNECTORS
    return unsubscribe;
};
