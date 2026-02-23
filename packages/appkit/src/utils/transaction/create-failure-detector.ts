/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ToncenterTransaction } from '@ton/walletkit';

import { getTxOpcode } from './get-tx-opcode';

/**
 * Generic factory function to create a failure detector.
 * Checks if ANY transaction in the trace has aborted, EXCEPT those
 * explicitly listed in the `nonCriticalOpcodes` set.
 *
 * If a transaction opcode is in `nonCriticalOpcodes`, its failure is ignored.
 * If a transaction has an unknown opcode or an opcode not in the set, and it fails,
 * the entire trace is considered failed.
 */
export const createFailureDetector = (nonCriticalOpcodes: Set<string>) => {
    return (transactions: Record<string, ToncenterTransaction>): boolean => {
        for (const tx of Object.values(transactions)) {
            if (tx.description?.aborted) {
                const opcode = getTxOpcode(tx);

                // If the opcode is known and in the non-critical list, ignore the abort
                if (opcode && nonCriticalOpcodes.has(opcode)) {
                    continue;
                }

                // Otherwise, the abort means the trace failed
                return true;
            }
        }

        return false;
    };
};
