/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { TonConnectUIProvider } from '@tonconnect/ui-react';
import { Toaster } from 'sonner';

import { AppRouter } from '@/components';

import './App.css';

// TonConnect manifest URL - in production, host your own manifest
const MANIFEST_URL = 'https://tonconnect-demo-dapp-with-react-ui.vercel.app/tonconnect-manifest.json';

function App() {
    return (
        <TonConnectUIProvider manifestUrl={MANIFEST_URL}>
            <AppRouter />
            <Toaster position="top-right" richColors />
        </TonConnectUIProvider>
    );
}

export default App;
