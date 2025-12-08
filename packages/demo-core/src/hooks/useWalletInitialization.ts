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

    const { initializeWalletKit, loadAllWallets } = useWalletStore(
        useShallow((state) => ({
            isHydrated: state.isHydrated,
            initializeWalletKit: state.initializeWalletKit,
            loadAllWallets: state.loadAllWallets,
        })),
    );

    const initialize = useCallback(async () => {
        setIsInitializing(true);
        setErrorMessage(null);

        try {
            await initializeWalletKit();
            await loadAllWallets();

            setIsInitializing(false);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Initialization failed';
            setErrorMessage(message);
            setIsInitializing(false);
            throw err;
        }
    }, [initializeWalletKit, loadAllWallets]);

    return {
        isInitializing,
        errorMessage,
        initialize,
    };
};
