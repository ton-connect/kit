/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ToncenterTransaction } from '../../types/toncenter/emulation';

/**
 * Checks if a single transaction failed.
 * A transaction is considered failed if it was aborted, or if its compute
 * or action phases failed to execute successfully (including skipped actions).
 */
export const isTransactionFailed = (tx: ToncenterTransaction): boolean => {
    const desc = tx.description;
    if (!desc) return false;

    // Transaction aborted
    if (desc.aborted) return true;

    // Compute phase failed
    if (desc.compute_ph?.success === false) return true;

    // Action phase failed completely
    if (desc.action?.success === false) return true;

    // Action phase skipped some actions (e.g. out of balance during sending)
    if (desc.action && desc.action.skipped_actions > 0) return true;

    return false;
};
