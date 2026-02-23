/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Cell, loadMessage } from '@ton/core';
import type { ToncenterTracesResponse } from '@ton/walletkit';

import { Network } from '../../types/network';
import type { AppKit } from '../../core/app-kit';
import { getNormalizedExtMessageHash } from '../../utils';
import { isFailedTx } from '../../utils';

export type TransactionStatusType = 'pending' | 'completed' | 'failed';

export interface TransactionStatusData {
    /** Overall status of the transaction trace */
    status: TransactionStatusType;
    /** Total messages in the trace */
    totalMessages: number;
    /** Messages still pending */
    pendingMessages: number;
    /** Number of completed messages (totalMessages - pendingMessages) */
    completedMessages: number;
}

export interface GetTransactionStatusParameters {
    /** BOC of the sent transaction (base64) */
    boc: string;
    /** Network to check the transaction on */
    network?: Network;
}

export type GetTransactionStatusReturnType = TransactionStatusData;

export type GetTransactionStatusErrorType = Error;

/**
 * Helper to parse ToncenterTracesResponse into TransactionStatusData.
 * Returns null if no traces are found.
 */
const parseTraceResponse = (response: ToncenterTracesResponse): TransactionStatusData | null => {
    if (!response.traces || response.traces.length === 0) {
        return null;
    }

    const trace = response.traces[0];
    const traceInfo = trace.trace_info;

    const isEffectivelyCompleted =
        traceInfo.trace_state === 'complete' ||
        (traceInfo.trace_state === 'pending' && traceInfo.pending_messages === 0);

    let status: TransactionStatusType = 'pending';
    if (isFailedTx(response)) {
        status = 'failed';
    } else if (isEffectivelyCompleted) {
        status = 'completed';
    }

    return {
        status,
        totalMessages: traceInfo.messages,
        pendingMessages: traceInfo.pending_messages,
        completedMessages: traceInfo.messages - traceInfo.pending_messages,
    };
};

/**
 * Get the status of a transaction by its BOC.
 *
 * In TON, a single external message triggers a tree of internal messages.
 * The transaction is "complete" only when the entire trace finishes.
 * This action checks toncenter's trace endpoints to determine the current status.
 *
 * @example
 * ```ts
 * const result = await sendTransaction(appKit, { messages: [...] });
 * const status = await getTransactionStatus(appKit, { boc: result.boc });
 * // status.status === 'pending' | 'completed' | 'failed'
 * // status.completedMessages === 3
 * // status.totalMessages === 5
 * ```
 */
export const getTransactionStatus = async (
    appKit: AppKit,
    parameters: GetTransactionStatusParameters,
): Promise<GetTransactionStatusReturnType> => {
    const { boc, network } = parameters;

    // Parse the BOC to get the external message hash
    const cell = Cell.fromBase64(boc);
    const message = loadMessage(cell.beginParse());
    const hash =
        message.info.type === 'external-in'
            ? getNormalizedExtMessageHash(message).toString('base64')
            : cell.hash().toString('base64');

    const client = appKit.networkManager.getClient(network ?? Network.mainnet());

    // First try pending traces (transaction still being processed)
    try {
        const pendingResponse = await client.getPendingTrace({ externalMessageHash: [hash] });
        const pendingStatus = parseTraceResponse(pendingResponse);
        if (pendingStatus) return pendingStatus;
    } catch (_e) {
        //
    }

    // Try completed traces
    try {
        const traceResponse = await client.getTrace({ traceId: [hash] });
        const completedStatus = parseTraceResponse(traceResponse);
        if (completedStatus) return completedStatus;
    } catch (_e) {
        //
    }

    // If neither pending nor completed trace found, the transaction
    // is likely still propagating to the network
    return {
        status: 'pending',
        totalMessages: 0,
        pendingMessages: 0,
        completedMessages: 0,
    };
};
