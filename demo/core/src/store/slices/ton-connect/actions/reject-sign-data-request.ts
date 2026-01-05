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

export const rejectSignDataRequest = async (reason?: string) => {
    const store = getStore();
    const state = store.getState();

    if (!state.tonConnect.pendingSignDataRequest) {
        tonConnectLog.error('No pending sign data request to reject');
        return;
    }

    if (!state.walletCore.walletKit) {
        // Close modal even if walletKit is not initialized
        store.setState((state) => {
            state.tonConnect.pendingSignDataRequest = undefined;
            state.tonConnect.isSignDataModalOpen = false;

            return state;
        });
        return;
    }

    try {
        await state.walletCore.walletKit.rejectSignDataRequest(state.tonConnect.pendingSignDataRequest, reason);
    } catch (error) {
        tonConnectLog.error('Failed to reject sign data request:', error);
    } finally {
        store.setState((state) => {
            state.tonConnect.pendingSignDataRequest = undefined;
            state.tonConnect.isSignDataModalOpen = false;

            return state;
        });

        clearCurrentRequestFromQueue();
    }
};
