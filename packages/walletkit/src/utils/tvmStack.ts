/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Cell, TupleItem } from '@ton/core';

import { loadTonCore } from '../deps/tonCore';

export type RawStackItem =
    | { type: 'null' }
    | { type: 'num' | 'cell' | 'slice' | 'builder'; value: string }
    | { type: 'tuple' | 'list'; value: RawStackItem[] };

async function ParseStackItem(item: RawStackItem, CellClass: typeof Cell): Promise<TupleItem> {
    switch (item.type) {
        case 'num':
            if (item.value.startsWith('-')) {
                return { type: 'int', value: -BigInt(item.value.slice(1)) };
            } else {
                return { type: 'int', value: BigInt(item.value) };
            }
        case 'null':
            return { type: 'null' };
        case 'cell':
            return { type: 'cell', cell: CellClass.fromBoc(Buffer.from(item.value, 'base64'))[0] };
        case 'tuple':
        case 'list':
            if (item.value.length === 0) {
                return { type: 'null' };
            }
            return {
                type: 'tuple',
                items: await Promise.all(item.value.map((value) => ParseStackItem(value, CellClass))),
            };
        default:
            throw Error(`Unsupported parse stack item type: ${JSON.stringify(item)}`);
    }
}

// todo - add support for all types
export async function ParseStack(list: RawStackItem[]): Promise<TupleItem[]> {
    const { Cell } = await loadTonCore();
    let stack: TupleItem[] = [];
    for (let item of list) {
        stack.push(await ParseStackItem(item, Cell));
    }
    return stack;
}

// todo - add support for all types
function SerializeStackItem(item: TupleItem): RawStackItem {
    switch (item.type) {
        case 'int':
            return { type: 'num', value: `${item.value < 0 ? '-' : ''}0x${item.value.toString(16)}` };
        case 'slice':
            return { type: 'slice', value: item.cell.toBoc().toString('base64') };
        case 'cell':
            return { type: 'cell', value: item.cell.toBoc().toString('base64') };
        default:
            throw Error(`Unsupported serialize stack item type: ${item.type}`);
    }
}

export function SerializeStack(list: TupleItem[]): RawStackItem[] {
    let stack: RawStackItem[] = [];
    for (let item of list) {
        stack.push(SerializeStackItem(item));
    }
    return stack;
}
