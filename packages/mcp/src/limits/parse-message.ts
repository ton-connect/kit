/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Cell } from '@ton/core';

// TEP-74 transfer (0x0f8a7ea5) and burn (0x595f07bc) share the same
// `op:uint32, query_id:uint64, amount:VarUInteger 16` prefix.
const JETTON_TRANSFER_OP = 0x0f8a7ea5;
const JETTON_BURN_OP = 0x595f07bc;

export function parseJettonOutflowAmount(payloadBase64: string | null | undefined): bigint | null {
    if (!payloadBase64) return null;
    try {
        const slice = Cell.fromBase64(payloadBase64).beginParse();
        if (slice.remainingBits < 96) return null;
        const op = slice.loadUint(32);
        if (op !== JETTON_TRANSFER_OP && op !== JETTON_BURN_OP) return null;
        slice.loadUintBig(64);
        return slice.loadCoins();
    } catch {
        return null;
    }
}
