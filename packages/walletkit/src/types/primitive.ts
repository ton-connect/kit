/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Cell } from '@ton/core';
import { Address, beginCell } from '@ton/core';

import type { UserFriendlyAddress } from '../api/models';

export type Base64String = string;

export function asMaybeAddressFriendly(data?: string | null): UserFriendlyAddress | null {
    try {
        return asAddressFriendly(data);
    } catch {
        /* empty */
    }
    return null;
}

export function asAddressFriendly(data?: string | null): UserFriendlyAddress {
    try {
        if (data) return Address.parse(data).toString();
    } catch {
        /* empty */
    }
    throw new Error(`Can not convert to AddressFriendly from "${data}"`);
}

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
