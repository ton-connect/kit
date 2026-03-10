/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

'use client';

import { AppKitProvider } from '@ton/appkit-react';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';

import { appKit } from '../configs/app-kit';
import { queryClient } from '../configs/query';
import { ThemeProvider } from '../components';

export default function AppKitContext({ children }: { children: ReactNode }) {
    return (
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
            <QueryClientProvider client={queryClient}>
                <AppKitProvider appKit={appKit}>
                    {children}
                    <Toaster position="top-right" richColors />
                </AppKitProvider>
            </QueryClientProvider>
        </ThemeProvider>
    );
}
