/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Base64ToHex } from '../../..';
import type {
    Hex,
    Transaction,
    TransactionTraceNode,
    TransactionTraceAction,
    UserFriendlyAddress,
} from '../../../api/models';
import { asMaybeAddressFriendly } from '../../../utils';
import type { TraceUpdate } from '../../types';
import type { EmulationTraceNode } from '../../../types/toncenter/emulation';
import type {
    StreamingV2TraceNotification,
    StreamingV2TraceInvalidatedNotification,
    StreamingV2Action,
} from '../types/transaction';
import { toStreamingTransaction } from './map-transaction';

function toTransactionTraceNode(node: EmulationTraceNode): TransactionTraceNode {
    return {
        txHash: node.tx_hash ? Base64ToHex(node.tx_hash) : undefined,
        inMsgHash: node.in_msg_hash ? Base64ToHex(node.in_msg_hash) : undefined,
        children: node.children?.map(toTransactionTraceNode) ?? [],
    };
}

function toTransactionTraceAction(action: StreamingV2Action): TransactionTraceAction {
    return {
        traceId: action.trace_id ?? undefined,
        actionId: action.action_id,
        startLt: action.start_lt,
        endLt: action.end_lt,
        startUtime: action.start_utime,
        endUtime: action.end_utime,
        traceEndLt: action.trace_end_lt,
        traceEndUtime: action.trace_end_utime,
        traceMcSeqnoEnd: action.trace_mc_seqno_end,
        transactions: action.transactions.map(Base64ToHex),
        isSuccess: action.success,
        traceExternalHash: Base64ToHex(action.trace_external_hash),
        accounts: (action.accounts ?? [])
            .map(asMaybeAddressFriendly)
            .filter((addr): addr is UserFriendlyAddress => addr !== null),
        details: { type: 'unknown', value: action.details as Record<string, unknown> }, // Simple wrap for now to avoid mirroring all detail mappers
    };
}

export function mapTrace(
    notification: StreamingV2TraceNotification | StreamingV2TraceInvalidatedNotification,
): TraceUpdate {
    if (notification.type === 'trace_invalidated') {
        return {
            hash: notification.trace_external_hash_norm,
            trace: undefined,
        };
    }

    const transactions: Record<Hex, Transaction> = {};
    Object.entries(notification.transactions).forEach(([hash, tx]) => {
        transactions[Base64ToHex(hash)] = toStreamingTransaction(tx, notification.trace_external_hash_norm);
    });

    return {
        hash: notification.trace_external_hash_norm,
        trace: {
            mcBlockSeqno: Object.values(notification.transactions)[0]?.mc_block_seqno ?? 0,
            trace: toTransactionTraceNode(notification.trace),
            transactions,
            actions: notification.actions?.map(toTransactionTraceAction) ?? [],
            randSeed: '' as Hex, // Not available in streaming v2 trace notification root
            isIncomplete: false, // Not explicitly provided
        },
    };
}
