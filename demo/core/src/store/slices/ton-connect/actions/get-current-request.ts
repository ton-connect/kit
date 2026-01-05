/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStore } from '../../../utils/store-instance';

export const getCurrentRequest = () => {
    const store = getStore();
    const state = store.getState();

    if (!state.tonConnect.requestQueue.currentRequestId) {
        return undefined;
    }

    return state.tonConnect.requestQueue.items.find(
        (item) => item.id === state.tonConnect.requestQueue.currentRequestId,
    );
};
