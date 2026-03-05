/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { mapTonApiGetMethodArgs, mapTonApiTvmStackRecord } from './map-methods';
import type { RawStackItem } from '../../../api/models';
import type { TonApiTvmStackRecord } from '../types/methods';

describe('map-methods', () => {
    describe('mapTonApiGetMethodArgs', () => {
        it('should map null', () => {
            const stack: RawStackItem[] = [{ type: 'null' }];
            expect(mapTonApiGetMethodArgs(stack)).toEqual([{ type: 'null', value: 'Null' }]);
        });

        it('should map NaN', () => {
            const stack: RawStackItem[] = [{ type: 'num', value: 'NaN' }];
            expect(mapTonApiGetMethodArgs(stack)).toEqual([{ type: 'nan', value: 'NaN' }]);
        });

        it('should map hex num to int257', () => {
            const stack: RawStackItem[] = [{ type: 'num', value: '0x1A' }];
            expect(mapTonApiGetMethodArgs(stack)).toEqual([{ type: 'int257', value: '0x1A' }]);

            const negativeStack: RawStackItem[] = [{ type: 'num', value: '-0x1A' }];
            expect(mapTonApiGetMethodArgs(negativeStack)).toEqual([{ type: 'int257', value: '-0x1A' }]);
        });

        it('should map decimal num to tinyint', () => {
            const stack: RawStackItem[] = [{ type: 'num', value: '123' }];
            expect(mapTonApiGetMethodArgs(stack)).toEqual([{ type: 'tinyint', value: '123' }]);
        });

        it('should map cell', () => {
            const stack: RawStackItem[] = [{ type: 'cell', value: 'base64boc' }];
            expect(mapTonApiGetMethodArgs(stack)).toEqual([{ type: 'cell_boc_base64', value: 'base64boc' }]);
        });

        it('should map slice to slice_boc_hex', () => {
            const base64Str = Buffer.from('test', 'utf-8').toString('base64');
            const hexStr = Buffer.from('test', 'utf-8').toString('hex');
            const stack: RawStackItem[] = [{ type: 'slice', value: base64Str }];
            expect(mapTonApiGetMethodArgs(stack)).toEqual([{ type: 'slice_boc_hex', value: hexStr }]);
        });

        it('should map builder to cell_boc_base64', () => {
            const stack: RawStackItem[] = [{ type: 'builder', value: 'base64boc' }];
            expect(mapTonApiGetMethodArgs(stack)).toEqual([{ type: 'cell_boc_base64', value: 'base64boc' }]);
        });

        it('should reject tuple and list', () => {
            expect(() => mapTonApiGetMethodArgs([{ type: 'tuple', value: [] }])).toThrow(
                "TonApi doesn't support tuple in get method arguments",
            );
            expect(() => mapTonApiGetMethodArgs([{ type: 'list', value: [] }])).toThrow(
                "TonApi doesn't support list in get method arguments",
            );
        });

        it('should reject unknown type', () => {
            // @ts-expect-error testing unknown type
            expect(() => mapTonApiGetMethodArgs([{ type: 'unknown' }])).toThrow('Unsupported stack item type: unknown');
        });

        it('should handle undefined stack', () => {
            expect(mapTonApiGetMethodArgs(undefined)).toEqual([]);
        });
    });

    describe('mapTonApiTvmStackRecord', () => {
        it('should map null', () => {
            const item: TonApiTvmStackRecord = { type: 'null' };
            expect(mapTonApiTvmStackRecord(item)).toEqual({ type: 'null' });
        });

        it('should map nan', () => {
            const item: TonApiTvmStackRecord = { type: 'nan' };
            expect(mapTonApiTvmStackRecord(item)).toEqual({ type: 'num', value: 'NaN' });
        });

        it('should map num', () => {
            const item: TonApiTvmStackRecord = { type: 'num', num: '0x123' };
            expect(mapTonApiTvmStackRecord(item)).toEqual({ type: 'num', value: '0x123' });
        });

        it('should map cell', () => {
            const hexStr = Buffer.from('test cell', 'utf-8').toString('hex');
            const base64Str = Buffer.from('test cell', 'utf-8').toString('base64');

            const item: TonApiTvmStackRecord = { type: 'cell', cell: hexStr };
            expect(mapTonApiTvmStackRecord(item)).toEqual({ type: 'cell', value: base64Str });
        });

        it('should map slice with slice field', () => {
            const hexStr = Buffer.from('test slice', 'utf-8').toString('hex');
            const base64Str = Buffer.from('test slice', 'utf-8').toString('base64');

            const item: TonApiTvmStackRecord = { type: 'slice', slice: hexStr };
            expect(mapTonApiTvmStackRecord(item)).toEqual({ type: 'slice', value: base64Str });
        });

        it('should map slice with fallback cell field', () => {
            const hexStr = Buffer.from('test slice fallback', 'utf-8').toString('hex');
            const base64Str = Buffer.from('test slice fallback', 'utf-8').toString('base64');

            const item: TonApiTvmStackRecord = { type: 'slice', cell: hexStr };
            expect(mapTonApiTvmStackRecord(item)).toEqual({ type: 'slice', value: base64Str });
        });

        it('should map tuple', () => {
            const item: TonApiTvmStackRecord = {
                type: 'tuple',
                tuple: [{ type: 'num', num: '123' }, { type: 'null' }],
            };
            expect(mapTonApiTvmStackRecord(item)).toEqual({
                type: 'tuple',
                value: [{ type: 'num', value: '123' }, { type: 'null' }],
            });
        });

        it('should handle tuple with undefined tuple field', () => {
            const item: TonApiTvmStackRecord = { type: 'tuple' };
            expect(mapTonApiTvmStackRecord(item)).toEqual({ type: 'tuple', value: [] });
        });

        it('should reject unknown type', () => {
            const item = { type: 'unknown' };
            // @ts-expect-error testing unknown type
            expect(() => mapTonApiTvmStackRecord(item)).toThrow('Unsupported TonApi stack item type: unknown');
        });
    });
});
