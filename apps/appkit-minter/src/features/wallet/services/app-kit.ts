/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AppKit, Network } from '@ton/appkit';
import { OmnistonSwapProvider } from '@ton/walletkit/swap/omniston';
import { registerProvider } from '@ton/appkit';

import { ENV_TON_API_KEY_MAINNET, ENV_TON_API_KEY_TESTNET } from '@/core/configs/env';

export const appKit = new AppKit({
    networks: {
        [Network.mainnet().chainId]: {
            apiClient: {
                url: 'https://toncenter.com',
                key: ENV_TON_API_KEY_MAINNET,
            },
        },
        [Network.testnet().chainId]: {
            apiClient: {
                url: 'https://testnet.toncenter.com',
                key: ENV_TON_API_KEY_TESTNET,
            },
        },
    },
});

registerProvider(appKit, new OmnistonSwapProvider());
