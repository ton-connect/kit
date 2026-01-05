/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStore } from '../../../utils/store-instance';

export const getActiveWallet = () => {
    const store = getStore();
    let state = store.getState();

    if (!state.walletManagement.activeWalletId) {
        return undefined;
    }

    return state.walletManagement.savedWallets.find((w) => w.id === state.walletManagement.activeWalletId);
};
