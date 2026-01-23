/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { Wallet as WalletInterface } from '@ton/walletkit';
import type { AppKit, EventBus, WalletProvider } from '@ton/appkit';
import { WALLET_EVENTS } from '@ton/appkit';

export interface AppKitContextType {
    appKit: AppKit;
    providers: ReadonlyArray<WalletProvider>;
    connectedWallets: WalletInterface[];
    connectWallet: (provider: WalletProvider) => Promise<void>;
    disconnectWallet: (provider: WalletProvider) => Promise<void>;
    eventBus: EventBus;
}

const AppKitContext = createContext<AppKitContextType | undefined>(undefined);

export interface AppKitProviderProps {
    appKit: AppKit;
    children: React.ReactNode;
}

export function AppKitProvider({ appKit, children }: AppKitProviderProps) {
    const [connectedWallets, setConnectedWallets] = useState<WalletInterface[]>([]);

    const syncWallets = useCallback(async () => {
        const wallets = await appKit.getConnectedWallets();
        setConnectedWallets(wallets);
    }, [appKit]);

    const connectWallet = useCallback(
        async (provider: WalletProvider) => {
            await appKit.connectWallet(provider.id);
        },
        [appKit],
    );

    const disconnectWallet = useCallback(
        async (provider: WalletProvider) => {
            await appKit.disconnectWallet(provider.id);
        },
        [appKit],
    );

    useEffect(() => {
        const eventBus = appKit.eventBus;
        eventBus.on(WALLET_EVENTS.CONNECTED, syncWallets);
        eventBus.on(WALLET_EVENTS.DISCONNECTED, syncWallets);
        eventBus.on(WALLET_EVENTS.CHANGED, syncWallets);

        // Initial sync
        syncWallets();

        return () => {
            eventBus.off(WALLET_EVENTS.CONNECTED, syncWallets);
            eventBus.off(WALLET_EVENTS.DISCONNECTED, syncWallets);
            eventBus.off(WALLET_EVENTS.CHANGED, syncWallets);
        };
    }, [appKit, syncWallets]);

    const value = useMemo<AppKitContextType>(
        () => ({
            appKit,
            providers: appKit.providers,
            connectedWallets,
            connectWallet,
            disconnectWallet,
            eventBus: appKit.eventBus,
        }),
        [appKit, connectedWallets, connectWallet, disconnectWallet],
    );

    return <AppKitContext.Provider value={value}>{children}</AppKitContext.Provider>;
}

export function useAppKit() {
    const context = useContext(AppKitContext);

    if (!context) {
        throw new Error('useAppKit must be used within an AppKitProvider');
    }

    return context;
}
