/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AppKit, Network } from '@ton/appkit';
import { OmnistonSwapProvider } from '@ton/appkit/swap/omniston';
import { TonConnectConnector, ApiClientTonApi } from '@ton/appkit';

import { ENV_TON_API_KEY_TESTNET } from '@/core/configs/env';

export const appKit = new AppKit({
    networks: {
        [Network.mainnet().chainId]: {
            apiClient: new ApiClientTonApi({
                network: Network.mainnet(),
            }),
        },
        [Network.testnet().chainId]: {
            apiClient: {
                url: 'https://testnet.toncenter.com',
                key: ENV_TON_API_KEY_TESTNET,
            },
        },
    },
    connectors: [
        new TonConnectConnector({
            tonConnectOptions: {
                manifestUrl: 'https://tonconnect-sdk-demo-dapp.vercel.app/tonconnect-manifest.json',
            },
        }),
    ],
    providers: [new OmnistonSwapProvider()],
});
