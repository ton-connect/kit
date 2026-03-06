/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AppKitProvider } from '@ton/appkit-react';

import { appKit } from '@/core/configs/app-kit';
import { DashboardLayout } from '@/components/layout/dashboard-layout';
import { DashboardPage } from '@/pages/dashboard-page';
import { AgentDetailPage } from '@/pages/agent-detail-page';
import { CreateAgentPage } from '@/pages/create-agent-page';

import '@ton/appkit-react/styles.css';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 30_000,
            refetchOnMount: false,
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
        },
    },
});

export function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <AppKitProvider appKit={appKit}>
                <BrowserRouter>
                    <DashboardLayout>
                        <Routes>
                            <Route path="/" element={<DashboardPage />} />
                            <Route path="/create" element={<CreateAgentPage />} />
                            <Route path="/agent/:id" element={<AgentDetailPage />} />
                        </Routes>
                    </DashboardLayout>
                </BrowserRouter>
                <Toaster
                    position="top-right"
                    theme="dark"
                    offset={{ top: '72px', right: '16px' }}
                    mobileOffset={{ top: '72px', right: '12px', left: '12px' }}
                    toastOptions={{
                        style: {
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: 'white',
                        },
                    }}
                />
            </AppKitProvider>
        </QueryClientProvider>
    );
}
