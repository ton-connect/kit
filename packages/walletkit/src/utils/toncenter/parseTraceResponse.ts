/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ToncenterTracesResponse } from '../../types/toncenter/emulation';
import type { TransactionStatusResponse } from '../../api/models/transactions/TransactionStatus';
import type { TransactionStatus } from '../../api/models/transactions/TransactionStatus';
import { isFailedTrace } from './isFailedTrace';

/**
 * Helper to parse ToncenterTracesResponse into TransactionStatusResponse.
 * Returns null if no traces are found.
 */
export const parseTraceResponse = (response: ToncenterTracesResponse): TransactionStatusResponse | null => {
    if (!response.traces || response.traces.length === 0) {
        return null;
    }

    const trace = response.traces[0];
    const traceInfo = trace.trace_info;

    const isEffectivelyCompleted =
        traceInfo.trace_state === 'complete' ||
        (traceInfo.trace_state === 'pending' && traceInfo.pending_messages === 0);

    let status: TransactionStatus = 'pending';

    // Only check for completion if the transaction is not pending
    if (traceInfo.pending_messages === 0) {
        if (isFailedTrace(response)) {
            status = 'failed';
        } else if (isEffectivelyCompleted) {
            status = 'completed';
        }
    }

    return {
        status,
        totalMessages: traceInfo.messages,
        pendingMessages: traceInfo.pending_messages,
        onchainMessages: traceInfo.messages - traceInfo.pending_messages,
    };
};
