/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStore } from '../../../utils/store-instance';
import { walletManagementLog } from '../utils';
import { switchWallet } from './switch-wallet';

export const removeWallet = (walletId: string) => {
    const store = getStore();
    const state = store.getState();

    const walletIndex = state.walletManagement.savedWallets.findIndex((w) => w.id === walletId);

    if (walletIndex === -1) {
        throw new Error('Wallet not found');
    }

    store.setState((state) => {
        state.walletManagement.savedWallets.splice(walletIndex, 1);

        if (state.walletManagement.activeWalletId === walletId) {
            if (state.walletManagement.savedWallets.length > 0) {
                const newActiveId = state.walletManagement.savedWallets[0].id;
                state.walletManagement.activeWalletId = newActiveId;
            } else {
                state.walletManagement.hasWallet = false;
                state.walletManagement.isAuthenticated = false;
                state.walletManagement.activeWalletId = undefined;
                state.walletManagement.address = undefined;
                state.walletManagement.publicKey = undefined;
                state.walletManagement.balance = undefined;
                state.walletManagement.currentWallet = undefined;
                state.walletManagement.events = [];
            }
        }

        return state;
    });

    walletManagementLog.info(`Removed wallet ${walletId}`);

    const newState = store.getState();

    if (newState.walletManagement.activeWalletId && newState.walletManagement.activeWalletId !== walletId) {
        void switchWallet(newState.walletManagement.activeWalletId);
    }
};
