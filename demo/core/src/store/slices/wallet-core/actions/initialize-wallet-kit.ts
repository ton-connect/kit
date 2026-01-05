/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getWalletKitConfig } from '../../../utils/config';
import { getStore } from '../../../utils/store-instance';
import { createWalletKitInstance, walletCoreLog } from '../utils';
import { loadSavedWalletsIntoKit } from '../../wallet-management/actions';
import { setupTonConnectListeners } from '../../ton-connect/actions/setup-ton-connect-listeners';

export const initializeWalletKit = (network: 'mainnet' | 'testnet' = 'testnet'): Promise<void> => {
    const store = getStore();
    const state = store.getState();
    const walletKitConfig = getWalletKitConfig();

    // Check if we need to reinitialize
    if (state.walletCore.walletKit) {
        walletCoreLog.info(`Reinitializing WalletKit to ${network}`);

        try {
            const existingWallets = state.walletCore.walletKit.getWallets();
            walletCoreLog.info(`Clearing ${existingWallets.length} existing wallets before reinitialization`);
        } catch (error) {
            walletCoreLog.warn('Error during cleanup:', error);
        }
    }

    // Create initializer promise for other slices to await
    let initResolve: () => void;
    let initReject: (error: Error) => void;
    const initializer = new Promise<void>((resolve, reject) => {
        initResolve = resolve;
        initReject = reject;
    });

    store.setState((state) => {
        state.walletCore.walletKitInitializer = initializer;
        return state;
    });

    // Create new WalletKit instance
    const walletKitPromise = createWalletKitInstance(walletKitConfig);

    walletKitPromise
        .then(async (walletKit) => {
            // Setup event listeners from tonConnectSlice
            setupTonConnectListeners(walletKit);

            store.setState((state) => {
                state.walletCore.walletKit = walletKit;

                return state;
            });

            // Load all saved wallets into the WalletKit instance
            await loadSavedWalletsIntoKit(walletKit);

            return walletKit;
        })
        .then(() => {
            initResolve();
        })
        .catch((error) => {
            initReject(error);
        });

    return initializer;
};
