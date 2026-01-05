/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStore } from '../../../utils/store-instance';
import { MODAL_CLOSE_DELAY } from '../constants';
import { processNextRequest } from './process-next-request';

export const clearCurrentRequestFromQueue = () => {
    const store = getStore();

    store.setState((state) => {
        const currentId = state.tonConnect.requestQueue.currentRequestId;
        state.tonConnect.requestQueue.items = state.tonConnect.requestQueue.items.filter(
            (item) => item.id !== currentId,
        );
        state.tonConnect.requestQueue.currentRequestId = undefined;
        state.tonConnect.requestQueue.isProcessing = false;

        return state;
    });

    setTimeout(() => {
        processNextRequest();
    }, MODAL_CLOSE_DELAY);
};
