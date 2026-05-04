/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AppKit, Network, createTonConnectConnector } from '@ton/appkit';
import { createOmnistonProvider } from '@ton/appkit/swap/omniston';
import { createDeDustProvider } from '@ton/appkit/swap/dedust';
import { createTonstakersProvider } from '@ton/appkit/staking/tonstakers';
import { createSwapsXyzProvider } from '@ton/appkit/crypto-onramp/swaps-xyz';

export const appKit = new AppKit({
    networks: {
        [Network.mainnet().chainId]: {
            apiClient: {
                url: 'https://toncenter.com',
                key: '25a9b2326a34b39a5fa4b264fb78fb4709e1bd576fc5e6b176639f5b71e94b0d',
            },
        },
        [Network.testnet().chainId]: {
            apiClient: {
                url: 'https://testnet.toncenter.com',
                key: 'd852b54d062f631565761042cccea87fa6337c41eb19b075e6c7fb88898a3992',
            },
        },
    },
    connectors: [
        createTonConnectConnector({
            tonConnectOptions: {
                manifestUrl:
                    'https://raw.githubusercontent.com/ton-connect/demo-dapp-with-react-ui/master/public/tonconnect-manifest.json',
            },
        }),
    ],
    providers: [
        createOmnistonProvider(),
        createDeDustProvider(),
        createTonstakersProvider(),
        createSwapsXyzProvider({
            apiKey: '1be323b5c83198191ba640f07f8815b0',
        }),
    ],
});
