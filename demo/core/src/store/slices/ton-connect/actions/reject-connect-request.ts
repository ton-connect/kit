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

export const rejectConnectRequest = async (reason?: string) => {
    const store = getStore();
    const state = store.getState();

    if (!state.tonConnect.pendingConnectRequest) {
        tonConnectLog.error('No pending connect request to reject');
        return;
    }

    const closeModal = () => {
        store.setState((state) => {
            state.tonConnect.pendingConnectRequest = undefined;
            state.tonConnect.isConnectModalOpen = false;

            return state;
        });

        clearCurrentRequestFromQueue();
    };

    if (!state.walletCore.walletKit) {
        tonConnectLog.error('WalletKit not initialized');
        closeModal();

        return;
    }

    try {
        await state.walletCore.walletKit.rejectConnectRequest(state.tonConnect.pendingConnectRequest, reason);
    } catch (error) {
        tonConnectLog.error('Failed to reject connect request:', error);
    }

    closeModal();
};
