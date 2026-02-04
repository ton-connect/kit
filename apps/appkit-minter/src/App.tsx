/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { Toaster } from 'sonner';

import { AppKitBridge } from '@/features/wallet';
import { AppRouter, ThemeProvider } from '@/core/components';

import './core/styles/app.css';
import '@ton/appkit-ui-react/styles.css';

// TonConnect manifest URL - in production, host your own manifest
const MANIFEST_URL = 'https://tonconnect-demo-dapp-with-react-ui.vercel.app/tonconnect-manifest.json';

function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
                <AppKitBridge>
                    <AppRouter />
                    <Toaster position="top-right" richColors />
                </AppKitBridge>
            </TonConnectUIProvider>
        </ThemeProvider>
    );
}

export default App;
