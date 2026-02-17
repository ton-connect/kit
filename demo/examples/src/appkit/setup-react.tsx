/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable import/order */

// SAMPLE_START: APPKIT_REACT_INIT
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppKit, Network, TonConnectConnector } from '@ton/appkit';
import { AppKitProvider } from '@ton/appkit-react';
import type { FC } from 'react';

// Import styles
import '@ton/appkit-react/styles.css';

// Initialize QueryClient
const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
        },
    },
});

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
            tonConnectOptions: {
                manifestUrl: 'https://ton-connect.github.io/demo-dapp-with-react-ui/tonconnect-manifest.json',
            },
        }),
    ],
});

export const App: FC = () => {
    return (
        <QueryClientProvider client={queryClient}>
            <AppKitProvider appKit={appKit}>{/* <AppContent /> */}</AppKitProvider>
        </QueryClientProvider>
    );
};
// SAMPLE_END: APPKIT_REACT_INIT

// SAMPLE_START: APPKIT_REACT_TONCONNECT_HOOKS
import { useTonAddress } from '@tonconnect/ui-react';

export const AppContent: FC = () => {
    const address = useTonAddress();

    return <p>Address: {address}</p>;
};
// SAMPLE_END: APPKIT_REACT_TONCONNECT_HOOKS
