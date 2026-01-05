/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStore } from '../../../utils/store-instance';

export const clearJettons = () => {
    const store = getStore();

    store.setState((state) => {
        state.jettons.userJettons = [];
        state.jettons.jettonTransfers = [];
        state.jettons.popularJettons = [];
        state.jettons.isLoadingJettons = false;
        state.jettons.isLoadingTransfers = false;
        state.jettons.isLoadingPopular = false;
        state.jettons.isRefreshing = false;
        state.jettons.error = null;
        state.jettons.transferError = null;
        state.jettons.lastJettonsUpdate = 0;
        state.jettons.lastTransfersUpdate = 0;
        state.jettons.lastPopularUpdate = 0;

        return state;
    });
};
