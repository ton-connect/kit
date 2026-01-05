/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { tonConnectLog } from '../utils';
import { getStore } from '../../../utils/store-instance';

export const clearExpiredRequests = () => {
    const store = getStore();
    const now = Date.now();

    store.setState((state) => {
        const originalLength = state.tonConnect.requestQueue.items.length;
        state.tonConnect.requestQueue.items = state.tonConnect.requestQueue.items.filter(
            (item) => item.expiresAt > now,
        );

        const removedCount = originalLength - state.tonConnect.requestQueue.items.length;
        if (removedCount > 0) {
            tonConnectLog.info(`Cleared ${removedCount} expired requests from queue`);
        }

        return state;
    });
};
