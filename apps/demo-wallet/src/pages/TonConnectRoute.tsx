/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTonConnect } from '@demo/wallet-core';

import { Layout } from '../components';
import { LoaderCircle } from '../components/LoaderCircle';
import { createComponentLogger } from '../utils/logger';

const log = createComponentLogger('TonConnectRoute');

export const TonConnectRoute: React.FC = () => {
    const navigate = useNavigate();
    const { handleTonConnectUrl } = useTonConnect();
    const hasHandled = useRef(false);

    useEffect(() => {
        if (hasHandled.current) return;
        hasHandled.current = true;

        const url = window.location.href;
        handleTonConnectUrl(url)
            .catch((err) => log.error('Failed to handle TON Connect URL:', err))
            .finally(() => navigate('/wallet', { replace: true }));
    }, [handleTonConnectUrl, navigate]);

    return (
        <Layout title="Connecting to dApp">
            <div className="py-10">
                <LoaderCircle size="lg" />
            </div>
        </Layout>
    );
};
