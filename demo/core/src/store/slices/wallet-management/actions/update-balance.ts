/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStore } from '../../../utils/store-instance';
import { walletManagementLog } from '../utils';

export const updateBalance = async () => {
    const store = getStore();
    const state = store.getState();

    if (!state.walletManagement.currentWallet) {
        walletManagementLog.warn('No wallet available to update balance');
        return;
    }

    try {
        const balance = await state.walletManagement.currentWallet.getBalance();
        const balanceString = balance.toString();

        store.setState((state) => {
            state.walletManagement.balance = balanceString;

            return state;
        });
    } catch (error) {
        walletManagementLog.error('Error updating balance:', error);
        throw new Error('Failed to update balance');
    }
};
