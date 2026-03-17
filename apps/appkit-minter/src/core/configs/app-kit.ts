/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AppKit, Network } from '@ton/appkit';
import { TonConnectConnector, ApiClientTonApi } from '@ton/appkit';
import { DeDustSwapProvider } from '@ton/appkit/swap/dedust';
import { OmnistonSwapProvider } from '@ton/appkit/swap/omniston';

import { ENV_TON_API_KEY_TESTNET, ENV_TON_API_KEY_MAINNET } from '@/core/configs/env';

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
        [Network.tetra().chainId]: {
            apiClient: new ApiClientTonApi({
                network: Network.tetra(),
                endpoint: 'https://tetra.tonapi.io',
            }),
        },
    },
    connectors: [
        new TonConnectConnector({
            tonConnectOptions: {
                manifestUrl: 'https://tonconnect-sdk-demo-dapp.vercel.app/tonconnect-manifest.json',
            },
        }),
    ],
    providers: [new DeDustSwapProvider(), new OmnistonSwapProvider()],
});
