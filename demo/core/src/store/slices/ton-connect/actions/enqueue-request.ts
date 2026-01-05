/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { getStore } from '../../../utils/store-instance';
import { tonConnectLog } from '../utils';
import type { QueuedRequest, QueuedRequestData } from '../../../../types';
import { MAX_QUEUE_SIZE, REQUEST_EXPIRATION_TIME } from '../constants';
import { clearExpiredRequests } from './clear-expired-requests';
import { processNextRequest } from './process-next-request';

export const enqueueRequest = (request: QueuedRequestData) => {
    const store = getStore();
    const state = store.getState();

    const requestId = `${request.type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    if (state.tonConnect.requestQueue.items.length >= MAX_QUEUE_SIZE) {
        tonConnectLog.warn('Queue is full, attempting to clear expired requests');

        clearExpiredRequests();

        const updatedState = store.getState();

        if (updatedState.tonConnect.requestQueue.items.length >= MAX_QUEUE_SIZE) {
            tonConnectLog.error(
                `Queue overflow: cannot add more requests. Queue is full (${MAX_QUEUE_SIZE} items). Please approve or reject pending requests.`,
            );

            return;
        }
    }

    const now = Date.now();
    const queuedRequest: QueuedRequest = {
        ...request,
        id: requestId,
        timestamp: now,
        expiresAt: now + REQUEST_EXPIRATION_TIME,
    };

    store.setState((state) => {
        state.tonConnect.requestQueue.items.push(queuedRequest);

        return state;
    });

    tonConnectLog.info(`Enqueued ${request.type} request`, {
        requestId,
        queueSize: state.tonConnect.requestQueue.items.length + 1,
    });

    if (!state.tonConnect.requestQueue.isProcessing) {
        processNextRequest();
    }
};
