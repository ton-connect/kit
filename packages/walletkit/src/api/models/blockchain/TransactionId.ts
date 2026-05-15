/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Hex } from '../core/Primitives';

/**
 * Canonical (lt, hash) pair identifying a transaction on the TON blockchain.
 */
export interface TransactionId {
    /**
     * Logical time of the transaction as a decimal string.
     * Uniquely orders transactions within an account.
     */
    lt: string;

    /**
     * Transaction hash in hex form (prefixed with `0x`).
     */
    hash: Hex;
}
