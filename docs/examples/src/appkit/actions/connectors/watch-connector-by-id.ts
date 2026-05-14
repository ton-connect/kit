/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { watchConnectorById } from '@ton/appkit';

export const watchConnectorByIdExample = (appKit: AppKit) => {
    // SAMPLE_START: WATCH_CONNECTOR_BY_ID
    const unsubscribe = watchConnectorById(appKit, {
        id: 'tonconnect',
        onChange: (connector) => {
            console.log('Connector updated:', connector);
        },
    });

    // Later: unsubscribe();
    // SAMPLE_END: WATCH_CONNECTOR_BY_ID
    return unsubscribe;
};
