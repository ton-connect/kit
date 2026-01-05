/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStore } from '../../../utils/store-instance';
import { walletManagementLog } from '../utils';

export const renameWallet = (walletId: string, newName: string) => {
    const store = getStore();

    store.setState((state) => {
        const wallet = state.walletManagement.savedWallets.find((w) => w.id === walletId);
        if (wallet) {
            wallet.name = newName;
        }

        return state;
    });

    walletManagementLog.info(`Renamed wallet ${walletId} to ${newName}`);
};
