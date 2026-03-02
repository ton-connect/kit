/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';
import { beginCell } from '@ton/core';

import { ParseStack, SerializeStack } from './tvmStack';

describe('ParseStack', () => {
    it('parses a positive hex num', () => {
        const result = ParseStack([{ type: 'num', value: '0x10' }]);
        expect(result).toHaveLength(1);
        expect(result[0]).toEqual({ type: 'int', value: 16n });
    });

    it('parses zero', () => {
        const result = ParseStack([{ type: 'num', value: '0x0' }]);
        expect(result[0]).toEqual({ type: 'int', value: 0n });
    });

    it('parses a negative num', () => {
        const result = ParseStack([{ type: 'num', value: '-0x5' }]);
        expect(result[0]).toEqual({ type: 'int', value: -5n });
    });

    it('parses null item', () => {
        const result = ParseStack([{ type: 'null' }]);
        expect(result[0]).toEqual({ type: 'null' });
    });

    it('parses a cell from base64', () => {
        // build a simple cell and round-trip via base64
        const cell = beginCell().storeUint(42, 32).endCell();
        const base64 = cell.toBoc().toString('base64');

        const result = ParseStack([{ type: 'cell', value: base64 }]);
        const item = result[0];
        if (item.type !== 'cell') throw new Error('expected cell');
        expect(item.cell.toBoc().toString('base64')).toBe(base64);
    });

    it('parses an empty tuple/list as null', () => {
        const resultTuple = ParseStack([{ type: 'tuple', value: [] }]);
        expect(resultTuple[0]).toEqual({ type: 'null' });

        const resultList = ParseStack([{ type: 'list', value: [] }]);
        expect(resultList[0]).toEqual({ type: 'null' });
    });

    it('parses a non-empty list', () => {
        const result = ParseStack([
            {
                type: 'list',
                value: [
                    { type: 'num', value: '0x1' },
                    { type: 'num', value: '0x2' },
                ],
            },
        ]);
        const item = result[0];
        if (item.type !== 'tuple') throw new Error('expected tuple');
        expect(item.items).toHaveLength(2);
        expect(item.items[0]).toEqual({ type: 'int', value: 1n });
        expect(item.items[1]).toEqual({ type: 'int', value: 2n });
    });

    it('parses a nested tuple', () => {
        const result = ParseStack([
            {
                type: 'tuple',
                value: [
                    { type: 'num', value: '0x1' },
                    { type: 'num', value: '0x2' },
                ],
            },
        ]);
        const item = result[0];
        if (item.type !== 'tuple') throw new Error('expected tuple');
        expect(item.items).toHaveLength(2);
        expect(item.items[0]).toEqual({ type: 'int', value: 1n });
        expect(item.items[1]).toEqual({ type: 'int', value: 2n });
    });

    it('throws on unsupported type', () => {
        // @ts-expect-error  testing runtime guard
        expect(() => ParseStack([{ type: 'unknown_type', value: 'x' }])).toThrow();
    });

    it('parses multiple items preserving order', () => {
        const result = ParseStack([{ type: 'num', value: '0x1' }, { type: 'null' }, { type: 'num', value: '0x2' }]);
        expect(result).toHaveLength(3);
        expect(result[0]).toMatchObject({ type: 'int', value: 1n });
        expect(result[1]).toMatchObject({ type: 'null' });
        expect(result[2]).toMatchObject({ type: 'int', value: 2n });
    });
});

describe('SerializeStack', () => {
    it('serializes a positive int', () => {
        const result = SerializeStack([{ type: 'int', value: 255n }]);
        expect(result[0]).toEqual({ type: 'num', value: '0xff' });
    });

    it('serializes a negative int', () => {
        const result = SerializeStack([{ type: 'int', value: -10n }]) as Array<{ type: string; value: string }>;
        expect(result[0]).toEqual({ type: 'num', value: '-0xa' });
    });

    it('serializes zero', () => {
        const result = SerializeStack([{ type: 'int', value: 0n }]) as Array<{ type: string; value: string }>;
        expect(result[0]).toEqual({ type: 'num', value: '0x0' });
    });

    it('serializes a cell', () => {
        const cell = beginCell().storeUint(7, 8).endCell();
        const result = SerializeStack([{ type: 'cell', cell }]) as Array<{ type: string; value: string }>;
        expect(result[0].type).toBe('cell');
        expect(result[0].value).toBe(cell.toBoc().toString('base64'));
    });

    it('serializes a slice', () => {
        const cell = beginCell().storeUint(99, 16).endCell();
        const result = SerializeStack([{ type: 'slice', cell }]) as Array<{ type: string; value: string }>;
        expect(result[0].type).toBe('slice');
        expect(result[0].value).toBe(cell.toBoc().toString('base64'));
    });

    it('throws on tuple — not supported', () => {
        expect(() => SerializeStack([{ type: 'tuple', items: [] }])).toThrow();
    });
});

describe('round-trip: ParseStack(SerializeStack(items))', () => {
    it('int positive', () => {
        const original = [{ type: 'int' as const, value: 42n }];
        const serialized = SerializeStack(original);
        const parsed = ParseStack(serialized);
        expect(parsed[0]).toEqual({ type: 'int', value: 42n });
    });

    it('int negative', () => {
        const original = [{ type: 'int' as const, value: -1n }];
        const serialized = SerializeStack(original);
        const parsed = ParseStack(serialized);
        expect(parsed[0]).toEqual({ type: 'int', value: -1n });
    });

    it('cell round-trip', () => {
        const cell = beginCell().storeUint(123, 64).endCell();
        const original = [{ type: 'cell' as const, cell }];
        const serialized = SerializeStack(original);
        const parsed = ParseStack(serialized);
        const item = parsed[0];
        if (item.type !== 'cell') throw new Error('expected cell');
        expect(item.cell.toBoc().toString('base64')).toBe(cell.toBoc().toString('base64'));
    });

    it('slice — SerializeStack serializes it, but ParseStack does not support slice (no round-trip)', () => {
        const cell = beginCell().storeUint(5, 8).endCell();
        // Serialize succeeds
        const serialized = SerializeStack([{ type: 'slice', cell }]);
        expect(serialized[0].type).toBe('slice');
        // Parse throws because 'slice' is not handled in ParseStackItem
        expect(() => ParseStack(serialized)).toThrow();
    });
});
