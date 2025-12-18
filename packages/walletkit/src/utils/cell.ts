/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Cell } from '@ton/core';
import { beginCell } from '@ton/core';

export function limitString(data: string, limit: number): string {
    return data.length > limit ? data.substring(0, limit) : data;
}

export function toTinyString(data: string): Cell {
    data = limitString(data, 126);
    return beginCell().storeUint(data.length, 8).storeStringTail(data).endCell();
}

export function toStringTail(data: string): Cell {
    return beginCell().storeStringTail(limitString(data, 127)).endCell();
}

export function fromTinyString(data: Cell): string {
    return data.beginParse().skip(8).loadStringTail();
}
