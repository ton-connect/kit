/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Address, beginCell, Cell } from '@ton/core';

declare const hashBrand: unique symbol;

export type Hex = `0x${string}` & { readonly [hashBrand]: never };
export type Base64String = string;

export function asHex(data: string): Hex {
    if (!/^0x[0-9a-fA-F]+$/.test(data) || data.length % 2 !== 0) {
        throw new Error('Not a valid hex');
    }
    return data as Hex;
}

export type AddressFriendly = string;

export function asMaybeAddressFriendly(data?: string | null): AddressFriendly | null {
    try {
        return asAddressFriendly(data);
    } catch {
        /* empty */
    }
    return null;
}

export function asAddressFriendly(data?: string | null): AddressFriendly {
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
