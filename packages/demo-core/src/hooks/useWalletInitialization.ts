/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { useCallback, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useWalletStore } from './useWalletStore';

export interface WalletInitializationState {
    isInitializing: boolean;
    errorMessage: string | null;
    initialize: () => Promise<void>;
}

export const useWalletInitialization = (): WalletInitializationState => {
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [isInitializing, setIsInitializing] = useState(true);

    const { network, initializeWalletKit, loadAllWallets, updateBalance, refreshJettons } = useWalletStore(
        useShallow((state) => ({
            isHydrated: state.isHydrated,
            network: state.auth.network || 'testnet',
            initializeWalletKit: state.initializeWalletKit,
            loadAllWallets: state.loadAllWallets,
            updateBalance: state.updateBalance,
            refreshJettons: state.refreshJettons,
        })),
    );

    const initialize = useCallback(async () => {
        setIsInitializing(true);
        setErrorMessage(null);

        try {
            console.log('Initializing wallet...');
            await initializeWalletKit(network);
            console.log('Loading wallets...');
            await loadAllWallets();
            console.log('Updating balances...');
            await updateBalance();
            console.log('Refreshing jettons...');
            await refreshJettons();
            console.log('Wallet initialized successfully');

            setIsInitializing(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Initialization failed';
            console.error(message);
            setErrorMessage(message);
            setIsInitializing(false);
            throw err;
        }
    }, [network, initializeWalletKit, loadAllWallets, updateBalance, refreshJettons]);

    return {
        isInitializing,
        errorMessage,
        initialize,
    };
};
