/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStore } from '../../../utils/store-instance';
import { loadUserJettons } from './load-user-jettons';

export const refreshJettons = async (userAddress?: string) => {
    const store = getStore();
    const state = store.getState();

    const address = userAddress || state.walletManagement.address;

    if (!address) {
        return;
    }

    store.setState((state) => {
        state.jettons.isRefreshing = true;

        return state;
    });

    try {
        await loadUserJettons(address);
    } finally {
        store.setState((state) => {
            state.jettons.isRefreshing = false;
            return state;
        });
    }
};
