/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AppKitProvider } from '@ton/appkit-react';

import { appKit } from '@/core/configs/app-kit';
import { AppRouter, ThemeProvider } from '@/core/components';

import './core/styles/app.css';
import '@ton/appkit-react/styles.css';

const queryClient = new QueryClient();

export const App = () => {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <QueryClientProvider client={queryClient}>
                <AppKitProvider appKit={appKit}>
                    <AppRouter />
                    <Toaster position="top-right" richColors />
                </AppKitProvider>
            </QueryClientProvider>
        </ThemeProvider>
    );
};
