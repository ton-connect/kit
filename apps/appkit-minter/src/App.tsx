/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useMemo } from 'react';
import { AppKitProvider } from '@ton/appkit-ui-react';
import { TonConnectUIProvider, useTonConnectUI } from '@tonconnect/ui-react';
import { AppKit } from '@ton/appkit';
import { TonConnectProvider } from '@ton/appkit/tonconnect';
import { Network } from '@ton/walletkit';
import { Toaster } from 'sonner';

import { ENV_TON_API_KEY_MAINNET, ENV_TON_API_KEY_TESTNET } from './core/configs/env';

import { AppRouter } from '@/components';

import './App.css';

// TonConnect manifest URL - in production, host your own manifest
const MANIFEST_URL = 'https://tonconnect-demo-dapp-with-react-ui.vercel.app/tonconnect-manifest.json';

function AppKitBridge({ children }: { children: React.ReactNode }) {
    const [tonConnectUI] = useTonConnectUI();

    const appKit = useMemo(() => {
        if (!tonConnectUI) return null;

        // Create AppKit instance with networks configuration
        const kit = new AppKit({
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
        });

        // Register TonConnect provider - networkManager is passed during initialize
        kit.registerProvider(new TonConnectProvider({ tonConnect: tonConnectUI.connector }));

        return kit;
    }, [tonConnectUI]);

    // Wait for appKit
    if (!appKit) return null;

    return <AppKitProvider appKit={appKit}>{children}</AppKitProvider>;
}

function App() {
    return (
        <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
            <AppKitBridge>
                <AppRouter />
                <Toaster position="top-right" richColors />
            </AppKitBridge>
        </TonConnectUIProvider>
    );
}

export default App;
