/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ToncenterTracesResponse, ToncenterTraceItem } from '@ton/walletkit';

import { isJettonTransferTrace, isJettonTransferFailed } from './is-jetton-transfer';

/**
 * Fallback: strictly check the root (first) transaction.
 * If we don't know the trace type, we should only fail if the initial transaction failed.
 * Failing because of any random transaction in an unknown trace could cause false positives.
 */
const isRootTxFailed = (trace: ToncenterTraceItem): boolean => {
    const rootHash = trace.transactions_order?.[0];
    if (!rootHash) return false;

    const rootTx = trace.transactions?.[rootHash];
    if (!rootTx) return false;

    return !!rootTx.description?.aborted;
};

/**
 * Determines if a transaction trace has failed.
 *
 * In TON, a single transaction triggers a tree of internal messages.
 * Some messages can fail (abort) without affecting the main action.
 *
 * This function applies action-specific logic:
 * - **Jetton Transfer**: only checks critical messages (jetton_transfer + jetton_internal_transfer)
 * - **Unknown types**: falls back to checking the root (first) transaction
 *
 * @param tx - The trace response from toncenter
 * @returns `true` if the transaction is considered failed
 */
export const isFailedTx = (tx: ToncenterTracesResponse): boolean => {
    const trace = tx.traces?.[0];
    if (!trace) return false;

    const transactions = trace.transactions ?? {};
    if (Object.keys(transactions).length === 0) return false;

    // Jetton transfer: only check critical messages
    if (isJettonTransferTrace(transactions)) {
        return isJettonTransferFailed(transactions);
    }

    // Fallback for unknown types: check if the initial transaction failed
    return isRootTxFailed(trace);
};
