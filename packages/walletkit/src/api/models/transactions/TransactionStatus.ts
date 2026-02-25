/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export type TransactionStatus = 'unknown' | 'pending' | 'completed' | 'failed';

export interface TransactionStatusResponse {
    /** Overall status of the transaction trace */
    status: TransactionStatus;
    /** Total messages in the trace */
    totalMessages: number;
    /** Messages still pending */
    pendingMessages: number;
    /** Number of completed messages (totalMessages - pendingMessages) */
    completedMessages: number;
}
