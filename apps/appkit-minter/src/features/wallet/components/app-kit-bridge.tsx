/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useEffect } from 'react';
import { AppKitProvider } from '@ton/appkit-ui-react';
import { useTonConnectUI } from '@tonconnect/ui-react';
import { TonConnectConnector } from '@ton/appkit/tonconnect';

import { appKit } from '../services/app-kit';

interface AppKitBridgeProps {
    children: React.ReactNode;
}

export const AppKitBridge: React.FC<AppKitBridgeProps> = ({ children }) => {
    const [tonConnectUI] = useTonConnectUI();

    // Register TonConnect provider
    useEffect(() => {
        if (!tonConnectUI) return;

        const unregister = appKit.addConnector(
            new TonConnectConnector({
                tonConnect: tonConnectUI,
            }),
        );

        return unregister;
    }, [tonConnectUI]);

    return <AppKitProvider appKit={appKit}>{children}</AppKitProvider>;
};
