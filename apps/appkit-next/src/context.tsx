/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import { AppKit, Network, AppKitProvider, tonConnect } from '@ton/appkit-react';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
// import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';

import { ENV_TON_API_KEY_MAINNET, ENV_TON_API_KEY_TESTNET } from './config/env';

// Import styles
import '@ton/appkit-react/styles.css';

const appKit = new AppKit({
    ssr: true,
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
    connectors: [
        tonConnect({
            tonConnectOptions: {
                manifestUrl: 'https://tonconnect-demo-dapp-with-react-ui.vercel.app/tonconnect-manifest.json',
            },
        }),
    ],
});

const queryClient = new QueryClient();

export default function AppKitContext({ children }: { children: ReactNode }) {
    // const [appKit, setAppKit] = useState<AppKit | null>(null);

    // useEffect(() => {
    //     setAppKit(createAppKit());
    // }, []);

    // if (!appKit) {
    //     return null;
    // }

    return (
        <AppKitProvider appKit={appKit}>
            <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
        </AppKitProvider>
    );
}
