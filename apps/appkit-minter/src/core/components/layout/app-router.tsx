/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useWatchBalance, useWatchTransactions, useWatchJettons } from '@ton/appkit-react';
import { toast } from 'sonner';

import { MinterPage } from '@/pages';

export const AppRouter: React.FC = () => {
    // Enable global real-time balance updates
    useWatchBalance();
    useWatchJettons();

    // Enable real-time transaction notifications
    useWatchTransactions({
        onChange: (update) => {
            if (update.traceHash) {
                const hash = update.traceHash;
                const shortHash = `${hash.slice(0, 6)}...${hash.slice(-4)}`;

                if (update.status === 'invalidated') {
                    toast.error(`Transaction invalidated`, { id: hash, description: shortHash });
                } else if (update.status === 'finalized') {
                    toast.success(`Transaction finalized`, {
                        id: hash,
                        description: shortHash,
                        action: {
                            label: 'View',
                            onClick: () => window.open(`https://tonviewer.com/transaction/${hash}`, '_blank'),
                        },
                    });
                } else {
                    toast.loading(update.status === 'confirmed' ? `Transaction confirmed` : `Transaction pending...`, {
                        id: hash,
                        description: shortHash,
                    });
                }
            }
        },
    });

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<MinterPage />} />
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
};
