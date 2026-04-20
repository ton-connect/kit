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
    createPrivyConnector,
    ApiClientTonApi,
    ApiClientToncenter,
    createTonCenterStreamingProvider,
} from '@ton/appkit';
import { DeDustSwapProvider } from '@ton/appkit/swap/dedust';
import { OmnistonSwapProvider } from '@ton/appkit/swap/omniston';
import { createTonstakersProvider } from '@ton/appkit/staking/tonstakers';
import { TonApiGaslessProvider } from '@ton/appkit/gasless/tonapi';
import { TonApiClient } from '@ton-api/client';

import { ENV_TON_API_KEY_TESTNET, ENV_TON_API_KEY_MAINNET, ENV_PRIVY_APP_ID } from '@/core/configs/env';
import { loadStoredNetworkChainId } from '@/features/network';

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

const CONFIGURED_CHAIN_IDS = new Set([Network.mainnet().chainId, Network.testnet().chainId, Network.tetra().chainId]);

const storedChainId = loadStoredNetworkChainId();
const initialDefaultNetwork =
    storedChainId && CONFIGURED_CHAIN_IDS.has(storedChainId) ? Network.custom(storedChainId) : undefined;
const mainnetTonApi = new TonApiClient({
    baseUrl: 'https://tonapi.io',
});

export const appKit = new AppKit({
    networks: {
        [Network.mainnet().chainId]: { apiClient: mainnetApiClient },
        [Network.testnet().chainId]: { apiClient: testnetApiClient },
        [Network.tetra().chainId]: { apiClient: tetraApiClient },
    },
    defaultNetwork: initialDefaultNetwork,
    connectors: [
        createTonConnectConnector({
            tonConnectOptions: {
                manifestUrl: 'https://tonconnect-sdk-demo-dapp.vercel.app/tonconnect-manifest.json',
            },
        }),
        ...(ENV_PRIVY_APP_ID
            ? [createPrivyConnector({ appId: ENV_PRIVY_APP_ID, defaultNetwork: Network.mainnet() })]
            : []),
    ],
    providers: [
        new DeDustSwapProvider(),
        new OmnistonSwapProvider(),
        createTonstakersProvider({}),
        new TonApiGaslessProvider({ client: mainnetTonApi }),
    ],
});

// TODO: replace in normal config
appKit.streamingManager.registerProvider(
    createTonCenterStreamingProvider({ network: Network.mainnet(), apiKey: ENV_TON_API_KEY_MAINNET }),
);

appKit.streamingManager.registerProvider(
    createTonCenterStreamingProvider({ network: Network.testnet(), apiKey: ENV_TON_API_KEY_TESTNET }),
);
