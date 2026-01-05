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

export const rejectTransactionRequest = async (reason?: string) => {
    const store = getStore();
    const state = store.getState();

    if (!state.tonConnect.pendingTransactionRequest) {
        tonConnectLog.error('No pending transaction request to reject');
        return;
    }

    if (!state.walletCore.walletKit) {
        // Close modal even if walletKit is not initialized
        store.setState((state) => {
            state.tonConnect.pendingTransactionRequest = undefined;
            state.tonConnect.isTransactionModalOpen = false;

            return state;
        });

        return;
    }

    try {
        await state.walletCore.walletKit.rejectTransactionRequest(state.tonConnect.pendingTransactionRequest, reason);
    } catch (error) {
        tonConnectLog.error('Failed to reject transaction request:', error);
    } finally {
        store.setState((state) => {
            state.tonConnect.pendingTransactionRequest = undefined;
            state.tonConnect.isTransactionModalOpen = false;

            return state;
        });

        clearCurrentRequestFromQueue();
    }
};
