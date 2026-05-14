/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Cell } from '@ton/core';

export function decodeTextCommentPayload(payload: string): string | null {
    try {
        const slice = Cell.fromBase64(payload).beginParse();
        if (slice.remainingBits < 32) return null;
        const op = slice.loadUint(32);
        if (op !== 0) return null;
        const text = slice.loadStringTail();
        return text.length > 0 ? text : null;
    } catch {
        return null;
    }
}
