import { Cell, TupleItem, TupleReader } from '@ton/core';

export type RawStackItem =
    | { type: 'null' }
    | { type: 'num' | 'cell' | 'slice' | 'builder'; value: string }
    | { type: 'tuple' | 'list'; value: RawStackItem[] };

function parseStackItem(item: RawStackItem): TupleItem {
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
        case 'tuple':
        case 'list':
            if (item.value.length === 0) {
                return { type: 'null' };
            }
            return { type: 'tuple', items: item.value.map((value) => parseStackItem(value)) };
        default:
            throw Error(`Unsupported parse stack item type: ${JSON.stringify(item)}`);
    }
}

// todo - add support for all types
export function parseStack(list: RawStackItem[]): TupleReader {
    let stack: TupleItem[] = [];
    for (let item of list) {
        stack.push(parseStackItem(item));
    }
    return new TupleReader(stack);
}

// todo - add support for all types
function serializeStackItem(item: TupleItem): RawStackItem {
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

export function serializeStack(list: TupleItem[]): RawStackItem[] {
    let stack: RawStackItem[] = [];
    for (let item of list) {
        stack.push(serializeStackItem(item));
    }
    return stack;
}
