/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable import/order */

// SAMPLE_START: APPKIT_REACT_INIT
import { AppKit, Network, TonConnectConnector } from '@ton/appkit';
import { AppKitProvider } from '@ton/appkit-react';
import type { FC } from 'react';

// Import styles
import '@ton/appkit-react/styles.css';

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
        new TonConnectConnector({
            tonConnectOptions: { manifestUrl: 'your-manifest-url' },
        }),
    ],
});

export const App: FC = () => {
    return <AppKitProvider appKit={appKit}>{/* <AppContent /> */}</AppKitProvider>;
};
// SAMPLE_END: APPKIT_REACT_INIT

// SAMPLE_START: APPKIT_REACT_TONCONNECT_HOOKS
import { useTonAddress } from '@tonconnect/ui-react';

export const AppContent: FC = () => {
    const address = useTonAddress();

    return <p>Address: {address}</p>;
};
// SAMPLE_END: APPKIT_REACT_TONCONNECT_HOOKS
