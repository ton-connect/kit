/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export type TransactionStatus =
    | 'unknown' // we could not find the transaction in the network
    | 'pending' // transaction is either in mempool, or only partially processed
    | 'completed' // transaction trace is fully processed onchain and has no errors
    | 'failed'; // transaction trace is fully processed onchain and has errors

export interface TransactionStatusResponse {
    /** Overall status of the transaction trace */
    status: TransactionStatus;
    /** Total messages in the trace */
    totalMessages: number;
    /** Messages still pending */
    pendingMessages: number;
    /** Number of onchain messages (totalMessages - pendingMessages) */
    onchainMessages: number;
}
