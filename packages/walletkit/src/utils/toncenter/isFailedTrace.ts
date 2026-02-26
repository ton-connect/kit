/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ToncenterTracesResponse } from '../../types/toncenter/emulation';
import { createTraceTypeDetector } from './createTraceTypeDetector';
import { createFailureDetector } from './createFailureDetector';

interface TraceConfig {
    triggerOpcodes: Set<string>;
    safeToSkipOpcodes: Set<string>;
}

const KNOWN_TRACE_TYPES: TraceConfig[] = [
    {
        triggerOpcodes: new Set(['0x0f8a7ea5']), // jetton_transfer initiates the flow
        safeToSkipOpcodes: new Set([
            '0x7362d09c', // jetton_notify
            '0xd53276db', // excess
        ]),
    },
];

/**
 * Determines if a transaction trace has failed.
 *
 * In TON, a single transaction triggers a tree of internal messages.
 * Some messages can fail (abort) or be skipped without affecting the main action.
 *
 * This function applies action-specific logic:
 * - Checks known trace types (like Jetton Transfers) against their specific allowed failures.
 * - **Unknown types**: checks if ANY transaction in the trace has failed.
 *
 * @param tx - The trace response from toncenter
 * @returns `true` if the trace is considered failed
 */
export const isFailedTrace = (tx: ToncenterTracesResponse): boolean => {
    const trace = tx.traces?.[0];
    if (!trace) return false;

    const transactions = trace.transactions ?? {};
    if (Object.keys(transactions).length === 0) return false;

    for (const config of KNOWN_TRACE_TYPES) {
        const isMatch = createTraceTypeDetector(config.triggerOpcodes)(transactions);
        if (isMatch) {
            return createFailureDetector(config.safeToSkipOpcodes)(transactions);
        }
    }

    // Fallback for unknown types: check all transactions with an empty whitelist
    return createFailureDetector(new Set())(transactions);
};
