/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ToncenterTransaction } from '../../types/toncenter/emulation';
import { getTxOpcode } from './getTxOpcode';

/**
 * Generic factory function to create a trace type detector.
 * Returns true if the trace contains at least one transaction with ANY of the trigger opcodes.
 */
export const createTraceTypeDetector = (triggerOpcodes: Set<string>) => {
    return (transactions: Record<string, ToncenterTransaction>): boolean => {
        for (const tx of Object.values(transactions)) {
            const opcode = getTxOpcode(tx);
            if (opcode && triggerOpcodes.has(opcode)) return true;
        }

        return false;
    };
};
