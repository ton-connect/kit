/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Cell } from '@ton/core';

import { loadTonCore, getTonCore } from '../deps/tonCore';

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

export async function asMaybeAddressFriendly(data?: string | null): Promise<AddressFriendly | null> {
    try {
        return await asAddressFriendly(data);
    } catch {
        /* empty */
    }
    return null;
}

/**
 * Convert address to friendly format (sync version, requires @ton/core to be already loaded)
 * Returns null if conversion fails
 */
export function asMaybeAddressFriendlySync(data?: string | null): AddressFriendly | null {
    try {
        return asAddressFriendlySync(data);
    } catch {
        /* empty */
    }
    return null;
}

/**
 * Convert address to friendly format (async version, loads @ton/core if needed)
 */
export async function asAddressFriendly(data?: string | null): Promise<AddressFriendly> {
    const { Address } = await loadTonCore();
    try {
        if (data) return Address.parse(data).toString();
    } catch {
        /* empty */
    }
    throw new Error(`Can not convert to AddressFriendly from "${data}"`);
}

/**
 * Convert address to friendly format (sync version, requires @ton/core to be already loaded)
 * Use this only after loadTonCore() has been called.
 */
export function asAddressFriendlySync(data?: string | null): AddressFriendly {
    const { Address } = getTonCore();
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

export async function toTinyString(data: string): Promise<Cell> {
    const { beginCell } = await loadTonCore();
    data = limitString(data, 126);
    return beginCell().storeUint(data.length, 8).storeStringTail(data).endCell();
}

export async function toStringTail(data: string): Promise<Cell> {
    const { beginCell } = await loadTonCore();
    return beginCell().storeStringTail(limitString(data, 127)).endCell();
}

export async function fromTinyString(data: Cell): Promise<string> {
    return data.beginParse().skip(8).loadStringTail();
}
