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
import { createLayerswapProvider } from '@ton/appkit/crypto-onramp/layerswap';
import { createAppkitOnrampProvider } from '@ton/appkit/onramp/appkit-onramp';

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
        createLayerswapProvider(),
        createAppkitOnrampProvider({ apiKey: 'ak_test_66546d3cebb69dc4397570d65aad14dd' }),
    ],
});
