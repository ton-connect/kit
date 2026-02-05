/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TupleItem } from '@ton/core';
import { Cell } from '@ton/core';

import type { RawStackItem } from '../api/models/';
export type { RawStackItem };

function ParseStackItem(item: RawStackItem): TupleItem {
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
            return { type: 'cell', cell: Cell.fromBoc(Buffer.from(item.value, 'base64'))[0] };
        case 'slice':
            // Slice is returned as base64 BOC - parse it as a slice
            return { type: 'slice', cell: Cell.fromBoc(Buffer.from(item.value, 'base64'))[0] };
        case 'builder':
            // Builder is returned as base64 BOC - parse it as a builder
            return { type: 'builder', cell: Cell.fromBoc(Buffer.from(item.value, 'base64'))[0] };
        case 'tuple':
        case 'list':
            if (item.value.length === 0) {
                return { type: 'null' };
            }
            return { type: 'tuple', items: item.value.map((value) => ParseStackItem(value)) };
        default:
            throw Error(`Unsupported parse stack item type: ${JSON.stringify(item)}`);
    }
}

// todo - add support for all types
export function ParseStack(list: RawStackItem[]): TupleItem[] {
    let stack: TupleItem[] = [];
    for (let item of list) {
        stack.push(ParseStackItem(item));
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
