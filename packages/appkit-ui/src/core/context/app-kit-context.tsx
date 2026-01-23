/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { JSX, Accessor } from 'solid-js';
import { createContext, useContext, createSignal, onMount, onCleanup } from 'solid-js';
import type { Wallet as WalletInterface } from '@ton/walletkit';
import type { AppKit, EventBus, WalletProvider } from '@ton/appkit';
import { WALLET_EVENTS } from '@ton/appkit';

export interface AppKitContextType {
    appKit: AppKit;
    providers: ReadonlyArray<WalletProvider>;
    connectedWallets: Accessor<WalletInterface[]>;
    connectWallet: (provider: WalletProvider) => Promise<void>;
    disconnectWallet: (provider: WalletProvider) => Promise<void>;
    eventBus: EventBus;
}

const AppKitContext = createContext<AppKitContextType>();

export interface AppKitProviderProps {
    appKit: AppKit;
    children: JSX.Element;
}

export function AppKitProvider(props: AppKitProviderProps) {
    const [connectedWallets, setConnectedWallets] = createSignal<WalletInterface[]>([]);

    const syncWallets = async () => {
        const wallets = await props.appKit.getConnectedWallets();
        setConnectedWallets(wallets);
    };

    const connectWallet = async (provider: WalletProvider) => {
        await props.appKit.connectWallet(provider.id);
    };

    const disconnectWallet = async (provider: WalletProvider) => {
        await props.appKit.disconnectWallet(provider.id);
    };

    onMount(() => {
        const eventBus = props.appKit.eventBus;
        eventBus.on(WALLET_EVENTS.CONNECTED, syncWallets);
        eventBus.on(WALLET_EVENTS.DISCONNECTED, syncWallets);
        eventBus.on(WALLET_EVENTS.CHANGED, syncWallets);

        // Initial sync
        syncWallets();
    });

    onCleanup(() => {
        // Cleanup is handled by AppKit
    });

    const value: AppKitContextType = {
        appKit: props.appKit,
        providers: props.appKit.providers,
        connectedWallets,
        connectWallet,
        disconnectWallet,
        eventBus: props.appKit.eventBus,
    };

    return <AppKitContext.Provider value={value}>{props.children}</AppKitContext.Provider>;
}

export function useAppKit() {
    const context = useContext(AppKitContext);
    if (!context) {
        throw new Error('useAppKit must be used within an AppKitProvider');
    }
    return context;
}
