/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import {
    AppKit,
    Network,
    createTonConnectConnector,
    ApiClientTonApi,
    ApiClientToncenter,
    createTonCenterStreamingProvider,
} from '@ton/appkit';
import { DeDustSwapProvider } from '@ton/appkit/swap/dedust';
import { OmnistonSwapProvider } from '@ton/appkit/swap/omniston';
import { createTonstakersProvider } from '@ton/appkit/staking/tonstakers';
import { SwapsXyzCryptoOnrampProvider } from '@ton/appkit/crypto-onramp/swaps-xyz';

import { ENV_TON_API_KEY_TESTNET, ENV_TON_API_KEY_MAINNET } from '@/core/configs/env';

const mainnetApiClient = new ApiClientToncenter({
    network: Network.mainnet(),
    apiKey: ENV_TON_API_KEY_MAINNET,
});

const testnetApiClient = new ApiClientToncenter({
    network: Network.testnet(),
    apiKey: ENV_TON_API_KEY_TESTNET,
});

const tetraApiClient = new ApiClientTonApi({
    network: Network.tetra(),
    endpoint: 'https://tetra.tonapi.io',
});

export const appKit = new AppKit({
    networks: {
        [Network.mainnet().chainId]: { apiClient: mainnetApiClient },
        [Network.testnet().chainId]: { apiClient: testnetApiClient },
        [Network.tetra().chainId]: { apiClient: tetraApiClient },
    },
    connectors: [
        createTonConnectConnector({
            tonConnectOptions: {
                manifestUrl: 'https://tonconnect-sdk-demo-dapp.vercel.app/tonconnect-manifest.json',
            },
        }),
    ],
    providers: [
        new DeDustSwapProvider(),
        new OmnistonSwapProvider(),
        createTonstakersProvider({}),
        new SwapsXyzCryptoOnrampProvider({
            apiKey: '1be323b5c83198191ba640f07f8815b0',
        }),
    ],
});

// TODO: replace in normal config
appKit.streamingManager.registerProvider(
    createTonCenterStreamingProvider({ network: Network.mainnet(), apiKey: ENV_TON_API_KEY_MAINNET }),
);

appKit.streamingManager.registerProvider(
    createTonCenterStreamingProvider({ network: Network.testnet(), apiKey: ENV_TON_API_KEY_TESTNET }),
);
