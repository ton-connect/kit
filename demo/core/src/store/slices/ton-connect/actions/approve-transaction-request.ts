/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStore } from '../../../utils/store-instance';
import { tonConnectLog } from '../utils';
import { clearCurrentRequestFromQueue } from './clear-current-request-from-queue';

export const approveTransactionRequest = async () => {
    const store = getStore();
    const state = store.getState();

    if (!state.tonConnect.pendingTransactionRequest) {
        tonConnectLog.error('No pending transaction request to approve');
        return;
    }

    if (!state.walletCore.walletKit) {
        throw new Error('WalletKit not initialized');
    }

    await state.walletCore.walletKit.approveTransactionRequest(state.tonConnect.pendingTransactionRequest);

    setTimeout(() => {
        store.setState((state) => {
            state.tonConnect.pendingTransactionRequest = undefined;
            state.tonConnect.isTransactionModalOpen = false;

            return state;
        });

        clearCurrentRequestFromQueue();
    }, 3000);
};
