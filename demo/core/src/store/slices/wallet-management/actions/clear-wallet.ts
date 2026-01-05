/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStore } from '../../../utils/store-instance';

export const clearWalletManagementState = () => {
    const store = getStore();

    store.setState((state) => {
        state.walletManagement.isAuthenticated = false;
        state.walletManagement.hasWallet = false;
        state.walletManagement.savedWallets = [];
        state.walletManagement.activeWalletId = undefined;
        state.walletManagement.address = undefined;
        state.walletManagement.balance = undefined;
        state.walletManagement.publicKey = undefined;
        state.walletManagement.events = [];
        state.walletManagement.currentWallet = undefined;
        state.tonConnect.pendingConnectRequest = undefined;
        state.tonConnect.isConnectModalOpen = false;
        state.tonConnect.pendingTransactionRequest = undefined;
        state.tonConnect.isTransactionModalOpen = false;
        state.tonConnect.pendingSignDataRequest = undefined;
        state.tonConnect.isSignDataModalOpen = false;

        return state;
    });
};
