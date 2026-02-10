/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { FC } from 'react';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwap } from '@demo/wallet-core';

import { Layout, Button } from '../components';
import { SwapInterface } from '../components/swap/SwapInterface';

import { USDT_ADDRESS } from '@/constants/swap';

export const Swap: FC = () => {
    const navigate = useNavigate();
    const { setFromToken, setToToken, clearSwap } = useSwap();

    useEffect(() => {
        setFromToken({ type: 'ton' });
        setToToken({ type: 'jetton', value: USDT_ADDRESS });

        return () => clearSwap();
    }, []);

    return (
        <Layout title="Swap TON ↔ USDT">
            <div className="flex items-center space-x-4 mb-6">
                <Button variant="secondary" size="sm" onClick={() => navigate('/wallet')}>
                    ← Back
                </Button>
            </div>

            <SwapInterface />

            {/* Warning */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mt-6">
                <div className="flex">
                    <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                            <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                            />
                        </svg>
                    </div>
                    <div className="ml-3">
                        <p className="text-sm text-yellow-800">
                            Always verify the swap details before executing. Quotes may expire and need to be refreshed.
                        </p>
                    </div>
                </div>
            </div>
        </Layout>
    );
};
