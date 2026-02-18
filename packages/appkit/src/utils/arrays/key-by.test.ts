/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import { keyBy } from './key-by';

describe('keyBy', () => {
    it('should key array by property', () => {
        const array = [
            { id: 1, name: 'a' },
            { id: 2, name: 'b' },
        ];
        const result = keyBy(array, (item) => item.id);
        expect(result).toEqual({
            1: { id: 1, name: 'a' },
            2: { id: 2, name: 'b' },
        });
    });

    it('should handle property collision (last wins)', () => {
        const array = [
            { id: 1, name: 'a' },
            { id: 1, name: 'b' },
        ];
        // Based on implementation: arr.forEach(...) which iterates in order
        const result = keyBy(array, (item) => item.id);
        expect(result).toEqual({
            1: { id: 1, name: 'b' },
        });
    });

    it('should handle empty array', () => {
        const array: { id: number }[] = [];
        const result = keyBy(array, (item) => item.id);
        expect(result).toEqual({});
    });

    it('should work with string keys', () => {
        const array = [
            { id: 'a', val: 1 },
            { id: 'b', val: 2 },
        ];
        const result = keyBy(array, (item) => item.id);
        expect(result).toEqual({
            a: { id: 'a', val: 1 },
            b: { id: 'b', val: 2 },
        });
    });
});
