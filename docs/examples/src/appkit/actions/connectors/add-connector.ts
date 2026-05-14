/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { addConnector } from '@ton/appkit';
import { createTonConnectConnector } from '@ton/appkit';

export const addConnectorExample = (appKit: AppKit) => {
    // SAMPLE_START: ADD_CONNECTOR
    const unregister = addConnector(
        appKit,
        createTonConnectConnector({
            tonConnectOptions: {
                manifestUrl: 'https://tonconnect-sdk-demo-dapp.vercel.app/tonconnect-manifest.json',
            },
        }),
    );

    // Later: unregister();
    // SAMPLE_END: ADD_CONNECTOR
    return unregister;
};
