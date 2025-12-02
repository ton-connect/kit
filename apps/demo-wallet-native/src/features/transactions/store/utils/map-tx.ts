/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ToncenterTransaction } from '@ton/walletkit';

import type { Transaction } from '@/features/transactions';

export const mapTx = (tx: ToncenterTransaction): Transaction => {
    let type: 'send' | 'receive' = 'receive';
    let amount = '0';
    let address = '';

    // Determine transaction type first
    const hasOutgoingMessages = tx.out_msgs && tx.out_msgs.length > 0 && tx.out_msgs[0].value;

    if (hasOutgoingMessages) {
        // This is a send transaction
        type = 'send';
        const mainOutMsg = tx.out_msgs[0];
        amount = mainOutMsg.value || '0';
        address = mainOutMsg.destination;
    } else if (tx?.in_msg?.value) {
        type = 'receive';
        amount = tx.in_msg.value;
        address = tx.in_msg.source || '';
    }

    // Determine status based on transaction description
    let status: 'pending' | 'confirmed' | 'failed' = 'confirmed';

    if (tx.description.aborted) {
        status = 'failed';
    } else if (tx.description?.compute_ph?.success === false) {
        status = 'failed';
    }

    return {
        id: tx.hash,
        traceId: tx.trace_id || undefined,
        messageHash: tx.in_msg?.hash || '',
        type,
        amount,
        address,
        timestamp: tx.now * 1000, // Convert to milliseconds
        status,
        externalMessageHash: tx.trace_external_hash || undefined,
    };
};
