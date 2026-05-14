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

import { Layout } from '../components';
import { SwapInterface } from '../components/swap/SwapInterface';

import { USDT_ADDRESS } from '@/constants/swap';

export const Swap: FC = () => {
    const navigate = useNavigate();
    const { setFromToken, setToToken, clearSwap } = useSwap();

    useEffect(() => {
        setFromToken({ address: 'ton', decimals: 9, symbol: 'TON' });
        setToToken({ address: USDT_ADDRESS, decimals: 6, symbol: 'USDT' });

        return () => clearSwap();
    }, []);

    return (
        <Layout title="Swap TON ↔ USDT" onBack={() => navigate('/wallet')}>
            <SwapInterface />
        </Layout>
    );
};
