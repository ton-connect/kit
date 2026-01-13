/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import React from 'react';

// SAMPLE_START: SUMMARIZE_TRANSACTION_1
import type { MoneyFlowSelf } from '@ton/walletkit';
// SAMPLE_END: SUMMARIZE_TRANSACTION_1

// SAMPLE_START: SUMMARIZE_TRANSACTION_2
export function summarizeTransaction(preview: TransactionPreview) {
    if (preview.result === 'error') {
        return { kind: 'error', message: preview.emulationError.message } as const;
    }

    // MoneyFlow now provides ourTransfers - a simplified array of net asset changes
    const transfers = preview.moneyFlow.ourTransfers; // Array of MoneyFlowSelf

    // Each transfer has:
    // - type: 'ton' | 'jetton'
    // - amount: string (positive for incoming, negative for outgoing)
    // - jetton?: string (jetton master address, if type === 'jetton')

    return {
        kind: 'success' as const,
        transfers: transfers.map((transfer) => ({
            type: transfer.type,
            jettonAddress: transfer.type === 'jetton' ? transfer.jetton : 'TON',
            amount: transfer.amount, // string, can be positive or negative
            isIncoming: BigInt(transfer.amount) >= 0n,
        })),
    };
}
// SAMPLE_END: SUMMARIZE_TRANSACTION_2
