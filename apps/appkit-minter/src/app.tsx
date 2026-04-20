/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AppKitProvider } from '@ton/appkit-react';

import { PrivyBridgeProvider } from './privyProvider';

import { appKit } from '@/core/configs/app-kit';
import { ENV_PRIVY_APP_ID } from '@/core/configs/env';
import {
    AppRouter,
    ThemeProvider,
    ToasterProvider,
    TelegramPrivyAutoConnect,
    PrivyDebugPanel,
} from '@/core/components';

import './core/styles/index.css';

const queryClient = new QueryClient();

export const App = () => {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <QueryClientProvider client={queryClient}>
                <AppKitProvider appKit={appKit}>
                    <PrivyBridgeProvider>
                        <AppRouter />
                        <ToasterProvider />

                        {ENV_PRIVY_APP_ID && (
                            <>
                                <TelegramPrivyAutoConnect />
                                <PrivyDebugPanel />
                            </>
                        )}
                    </PrivyBridgeProvider>
                </AppKitProvider>
            </QueryClientProvider>
        </ThemeProvider>
    );
};
