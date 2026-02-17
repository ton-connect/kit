/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AppKit } from '@ton/appkit';
import { addConnector } from '@ton/appkit';
import { TonConnectConnector } from '@ton/appkit';

export const addConnectorExample = (appKit: AppKit) => {
    // SAMPLE_START: ADD_CONNECTOR
    const stopWatching = addConnector(
        appKit,
        new TonConnectConnector({
            tonConnectOptions: {
                manifestUrl: 'https://tonconnect-demo-dapp-with-react-ui.vercel.app/tonconnect-manifest.json',
            },
        }),
    );

    // Later: stopWatching();
    // SAMPLE_END: ADD_CONNECTOR
    return stopWatching;
};
