/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useWalletStore, useWallet } from '@ton/demo-core';

import { ProtectedRoute } from './ProtectedRoute';
import {
    SetupPassword,
    UnlockWallet,
    SetupWallet,
    WalletDashboard,
    SendTransaction,
    TracePage,
    TransactionDetail,
} from '../pages';

import { useWalletDataUpdater } from '@/hooks/useWalletDataUpdater';

export const AppRouter: React.FC = () => {
    const isPasswordSet = useWalletStore((state) => state.auth.isPasswordSet);
    const isUnlocked = useWalletStore((state) => state.auth.isUnlocked);
    const { hasWallet } = useWallet();

    useWalletDataUpdater();

    const getInitialRoute = () => {
        if (!isPasswordSet) return '/setup-password';
        if (!isUnlocked) return '/unlock';
        if (!hasWallet) return '/setup-wallet';
        return '/wallet';
    };

    return (
        <BrowserRouter>
            <Routes>
                {/* Public routes */}
                <Route path="/setup-password" element={<SetupPassword />} />
                <Route path="/unlock" element={<UnlockWallet />} />

                {/* Protected routes - require authentication */}
                <Route
                    path="/setup-wallet"
                    element={
                        <ProtectedRoute>
                            <SetupWallet />
                        </ProtectedRoute>
                    }
                />

                {/* Protected routes - require wallet */}
                <Route
                    path="/wallet"
                    element={
                        <ProtectedRoute requiresWallet>
                            <WalletDashboard />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/send"
                    element={
                        <ProtectedRoute requiresWallet>
                            <SendTransaction />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/wallet/transactions/:hash"
                    element={
                        <ProtectedRoute requiresWallet>
                            <TransactionDetail />
                        </ProtectedRoute>
                    }
                />
                <Route
                    path="/wallet/trace/:traceId"
                    element={
                        <ProtectedRoute requiresWallet>
                            <TracePage />
                        </ProtectedRoute>
                    }
                />

                {/* Redirect root to appropriate route */}
                <Route path="/" element={<Navigate to={getInitialRoute()} replace />} />

                {/* Catch all - redirect to root */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};
