/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStore } from '../../../utils/store-instance';

export const clearNfts = () => {
    const store = getStore();

    store.setState((state) => {
        state.nfts.userNfts = [];
        state.nfts.isLoadingNfts = false;
        state.nfts.isRefreshing = false;
        state.nfts.error = null;
        state.nfts.lastNftsUpdate = 0;
        state.nfts.hasMore = true;
        state.nfts.offset = 0;

        return state;
    });
};
