/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useEffect } from 'react';
import { AppKitProvider } from '@ton/appkit-ui-react';
import { TonConnectUIProvider, useTonConnectUI } from '@tonconnect/ui-react';
import { TonConnectProvider } from '@ton/appkit/tonconnect';
import { Toaster } from 'sonner';

import { appKit } from './services/app-kit';

import { AppRouter } from '@/components';

import './App.css';

// TonConnect manifest URL - in production, host your own manifest
const MANIFEST_URL = 'https://tonconnect-demo-dapp-with-react-ui.vercel.app/tonconnect-manifest.json';

function AppKitBridge({ children }: { children: React.ReactNode }) {
    const [tonConnectUI] = useTonConnectUI();

    // Register TonConnect provider
    useEffect(() => {
        if (!tonConnectUI) return;

        const unregister = appKit.registerProvider(
            new TonConnectProvider({
                tonConnect: tonConnectUI.connector,
            }),
        );

        return unregister;
    }, [tonConnectUI]);

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
