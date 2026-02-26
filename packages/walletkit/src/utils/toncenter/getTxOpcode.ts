/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ToncenterTransaction } from '../../types/toncenter/emulation';

/**
 * Returns the resolved opcode for a transaction.
 */
export const getTxOpcode = (tx: ToncenterTransaction): string | null => {
    const msg = tx.in_msg;
    if (!msg) return null;

    return msg.opcode ?? null;
};
