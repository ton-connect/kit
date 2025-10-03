import { Address, beginCell, Cell } from '@ton/core';

declare const hashBrand: unique symbol;

export type Hash = `0x${string}` & { readonly [hashBrand]: never };

export function asHash(data: string): Hash {
    if (!/^0x[0-9a-fA-F]{64}$/.test(data) && !/^0x[0-9a-fA-F]{128}$/.test(data)) {
        throw new Error('Not a valid 32-byte or 64-byte hash');
    }
    return data as Hash;
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
