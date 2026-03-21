/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    StreamingV2TraceInvalidatedNotification,
    StreamingV2TransactionsNotification,
    StreamingV2TraceNotification,
} from '../types/transaction';

export function isTransactionsNotification(msg: unknown): msg is StreamingV2TransactionsNotification {
    const m = msg as Record<string, unknown>;
    return (
        typeof msg === 'object' &&
        msg !== null &&
        m.type === 'transactions' &&
        typeof m.trace_external_hash_norm === 'string' &&
        Array.isArray(m.transactions)
    );
}

export function isTraceInvalidatedNotification(msg: unknown): msg is StreamingV2TraceInvalidatedNotification {
    const m = msg as Record<string, unknown>;
    return (
        typeof msg === 'object' &&
        msg !== null &&
        m.type === 'trace_invalidated' &&
        typeof m.trace_external_hash_norm === 'string'
    );
}

export function isTraceNotification(msg: unknown): msg is StreamingV2TraceNotification {
    const m = msg as Record<string, unknown>;
    return (
        typeof msg === 'object' &&
        msg !== null &&
        m.type === 'trace' &&
        typeof m.trace_external_hash_norm === 'string' &&
        m.trace !== undefined &&
        m.finality !== undefined &&
        m.transactions !== undefined
    );
}
