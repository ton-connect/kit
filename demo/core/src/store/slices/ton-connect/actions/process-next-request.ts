/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStore } from '../../../utils/store-instance';
import { tonConnectLog } from '../utils';
import { showConnectRequest } from './show-connect-request';
import { showTransactionRequest } from './show-transaction-request';
import { showSignDataRequest } from './show-sign-data-request';

export const processNextRequest = () => {
    const store = getStore();
    const state = store.getState();

    if (state.tonConnect.requestQueue.isProcessing) {
        tonConnectLog.info('Already processing a request, skipping');

        return;
    }

    const nextRequest = state.tonConnect.requestQueue.items[0];
    if (!nextRequest) {
        tonConnectLog.info('No more requests in queue');

        return;
    }

    if (nextRequest.expiresAt < Date.now()) {
        tonConnectLog.warn('Next request has expired, removing and trying next', { requestId: nextRequest.id });

        store.setState((state) => {
            state.tonConnect.requestQueue.items.shift();

            return state;
        });

        processNextRequest();

        return;
    }

    tonConnectLog.info(`Processing ${nextRequest.type} request`, { requestId: nextRequest.id });

    store.setState((state) => {
        state.tonConnect.requestQueue.isProcessing = true;
        state.tonConnect.requestQueue.currentRequestId = nextRequest.id;

        return state;
    });

    if (nextRequest.type === 'connect') {
        showConnectRequest(nextRequest.request);
    } else if (nextRequest.type === 'transaction') {
        showTransactionRequest(nextRequest.request);
    } else if (nextRequest.type === 'signData') {
        showSignDataRequest(nextRequest.request);
    }
};
