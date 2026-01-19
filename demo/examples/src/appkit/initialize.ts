/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// SAMPLE_START: APPKIT_INIT
import { CreateAppKit } from '@ton/appkit';
import { Network } from '@ton/walletkit';

// Create AppKit instance with network configuration
const appKit = CreateAppKit({
    networks: {
        [Network.mainnet().chainId]: {
            apiClient: {
                // Optional API key for Toncenter - get one at https://t.me/toncenter
                key: process.env.APP_TONCENTER_KEY,
                url: 'https://toncenter.com', // default
            },
        },
        // Optionally configure testnet as well
        // [Network.testnet().chainId]: {
        //     apiClient: {
        //         key: process.env.APP_TONCENTER_KEY_TESTNET,
        //         url: 'https://testnet.toncenter.com',
        //     },
        // },
    },
});
// SAMPLE_END: APPKIT_INIT

export { appKit };
