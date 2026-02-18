/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AppKit, Network, tonConnect } from '@ton/appkit';

export const setupAppKitExample = () => {
    // SAMPLE_START: APPKIT_INIT
    // Initialize AppKit
    const appKit = new AppKit({
        networks: {
            [Network.mainnet().chainId]: {
                apiClient: {
                    url: 'https://toncenter.com',
                    key: 'your-key',
                },
            },
            // Optional: add testnet
            // [Network.testnet().chainId]: {
            //     apiClient: {
            //         url: 'https://testnet.toncenter.com',
            //         key: 'your-key',
            //     },
            // },
        },
        connectors: [
            tonConnect({
                tonConnectOptions: {
                    manifestUrl: 'your-manifest-url',
                },
            }),
        ],
    });
    // SAMPLE_END: APPKIT_INIT

    return appKit;
};
