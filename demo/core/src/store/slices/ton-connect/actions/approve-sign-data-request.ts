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

export const approveSignDataRequest = async () => {
    const store = getStore();
    const state = store.getState();

    if (!state.tonConnect.pendingSignDataRequest) {
        tonConnectLog.error('No pending sign data request to approve');
        return;
    }

    if (!state.walletCore.walletKit) {
        throw new Error('WalletKit not initialized');
    }

    try {
        await state.walletCore.walletKit.approveSignDataRequest(state.tonConnect.pendingSignDataRequest);

        setTimeout(() => {
            store.setState((state) => {
                state.tonConnect.pendingSignDataRequest = undefined;
                state.tonConnect.isSignDataModalOpen = false;

                return state;
            });

            clearCurrentRequestFromQueue();
        }, 3000);
    } catch (error) {
        tonConnectLog.error('Failed to approve sign data request:', error);
        throw error;
    }
};
