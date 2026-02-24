/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ApiClient } from '../../types/toncenter/ApiClient';
import type { TransactionStatusResponse } from '../../api/models';
import { getNormalizedExtMessageHash } from '../getNormalizedExtMessageHash';
import { parseTraceResponse } from './parseTraceResponse';

/**
 * Get the status of a transaction by its BOC.
 *
 * In TON, a single external message triggers a tree of internal messages.
 * The transaction is "complete" only when the entire trace finishes.
 */
export async function getTransactionStatus(
    client: ApiClient,
    params: { boc: string; normalizedHash?: never } | { boc?: never; normalizedHash: string },
): Promise<TransactionStatusResponse> {
    const hashToSearch = params.boc ? getNormalizedExtMessageHash(params.boc).hash : params.normalizedHash;

    if (!hashToSearch) {
        throw new Error('Either boc or normalizedHash must be provided');
    }

    // First try pending traces (transaction still being processed)
    try {
        const pendingResponse = await client.getPendingTrace({ externalMessageHash: [hashToSearch] });
        const pendingStatus = parseTraceResponse(pendingResponse);
        if (pendingStatus) return pendingStatus;
    } catch (_e) {
        // ignore
    }

    // Try completed traces
    try {
        const traceResponse = await client.getTrace({ traceId: [hashToSearch] });
        const completedStatus = parseTraceResponse(traceResponse);
        if (completedStatus) return completedStatus;
    } catch (_e) {
        // ignore
    }

    // If neither pending nor completed trace found, the transaction
    // is likely still propagating to the network
    return {
        status: 'pending',
        totalMessages: 0,
        pendingMessages: 0,
        completedMessages: 0,
    };
}
