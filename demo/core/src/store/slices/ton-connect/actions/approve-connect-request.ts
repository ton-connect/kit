/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ConnectionRequestEvent, Wallet } from '@ton/walletkit';

import { getStore } from '../../../utils/store-instance';
import { tonConnectLog } from '../utils';
import { clearCurrentRequestFromQueue } from './clear-current-request-from-queue';

export const approveConnectRequest = async (selectedWallet: Wallet) => {
    const store = getStore();
    const state = store.getState();

    if (!state.tonConnect.pendingConnectRequest) {
        tonConnectLog.error('No pending connect request to approve');
        return;
    }

    if (!state.walletCore.walletKit) {
        throw new Error('WalletKit not initialized');
    }

    try {
        const updatedRequest: ConnectionRequestEvent = {
            ...state.tonConnect.pendingConnectRequest,
            walletAddress: selectedWallet.getAddress(),
            walletId: selectedWallet.getWalletId(),
        };

        await state.walletCore.walletKit.approveConnectRequest(updatedRequest);

        store.setState((state) => {
            state.tonConnect.pendingConnectRequest = undefined;
            state.tonConnect.isConnectModalOpen = false;

            return state;
        });

        void clearCurrentRequestFromQueue();
    } catch (error) {
        tonConnectLog.error('Failed to approve connect request:', error);
        throw error;
    }
};
