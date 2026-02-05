/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { useEffect } from 'react';
import { registerSwapProvider } from '@ton/appkit';
import { OmnistonSwapProvider } from '@ton/walletkit/swap/omniston';
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

    useEffect(() => {
        const provider = new OmnistonSwapProvider();
        registerSwapProvider(appKit, {
            name: 'omniston',
            provider,
        });
    }, []);

    return <AppKitProvider appKit={appKit}>{children}</AppKitProvider>;
};
