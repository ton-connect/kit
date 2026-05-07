/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { AppKitProvider } from '@ton/appkit-react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { AppKit } from '@ton/appkit';
import React from 'react';

// Create a helper to wrap components with necessary providers
export const createWrapper = (appKit: AppKit) => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: {
                retry: false,
            },
        },
    });

    return ({ children }: { children: React.ReactNode }) => (
        <QueryClientProvider client={queryClient}>
            <AppKitProvider appKit={appKit}>{children}</AppKitProvider>
        </QueryClientProvider>
    );
};
