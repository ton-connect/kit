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

import { ENV_TON_API_KEY_TESTNET, ENV_TON_API_KEY_MAINNET, ENV_TON_API_MIN_REQUEST_INTERVAL_MS } from '@/core/configs/env';

export const appKit = new AppKit({
    networks: {
        [Network.mainnet().chainId]: {
            apiClient: new ApiClientTonApi({
                network: Network.mainnet(),
                apiKey: ENV_TON_API_KEY_MAINNET,
                minRequestIntervalMs: ENV_TON_API_MIN_REQUEST_INTERVAL_MS,
            }),
        },
        [Network.testnet().chainId]: {
            apiClient: new ApiClientTonApi({
                network: Network.testnet(),
                apiKey: ENV_TON_API_KEY_TESTNET,
                minRequestIntervalMs: ENV_TON_API_MIN_REQUEST_INTERVAL_MS,
            }),
        },
        [Network.tetra().chainId]: {
            apiClient: new ApiClientTonApi({
                network: Network.tetra(),
                endpoint: 'https://tetra.tonapi.io',
                minRequestIntervalMs: ENV_TON_API_MIN_REQUEST_INTERVAL_MS,
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
    providers: [new OmnistonSwapProvider()],
});
