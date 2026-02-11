/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppKitProvider, useConnectorById } from '@ton/appkit-ui-react';
import type { PropsWithChildren, FC } from 'react';
import { TonConnectUIProvider } from '@tonconnect/ui-react';
import type { TonConnectConnector } from '@ton/appkit/tonconnect';

import { appKit, TONCONNECT_CONNECTOR_ID } from '@/core/configs/app-kit';
import { AppRouter, ThemeProvider } from '@/core/components';

import './core/styles/app.css';
import '@ton/appkit-ui-react/styles.css';

const queryClient = new QueryClient();

const TonConnectBridge: FC<PropsWithChildren> = ({ children }) => {
    const tonConnectConnector = useConnectorById(TONCONNECT_CONNECTOR_ID) as TonConnectConnector;

    if (!tonConnectConnector) {
        throw new Error('TonConnect connector not found');
    }

    return <TonConnectUIProvider instance={tonConnectConnector.tonConnectUI}>{children}</TonConnectUIProvider>;
};

function App() {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <QueryClientProvider client={queryClient}>
                <AppKitProvider appKit={appKit}>
                    <TonConnectBridge>
                        <AppRouter />
                        <Toaster position="top-right" richColors />
                    </TonConnectBridge>
                </AppKitProvider>
            </QueryClientProvider>
        </ThemeProvider>
    );
}

export default App;
