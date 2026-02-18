/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it, vi } from 'vitest';

import { randomFromArray } from './random-from-array';

describe('randomFromArray', () => {
    it('should return an item from the array', () => {
        const array = [1, 2, 3];
        const item = randomFromArray(array);
        expect(array).toContain(item);
    });

    it('should return undefined for empty array', () => {
        const array: number[] = [];
        const item = randomFromArray(array);
        expect(item).toBeUndefined();
    });

    it('should work with single item', () => {
        const array = [42];
        expect(randomFromArray(array)).toBe(42);
    });

    it('should use Math.random', () => {
        const randomSpy = vi.spyOn(Math, 'random');
        randomFromArray([1, 2]);
        expect(randomSpy).toHaveBeenCalled();
        randomSpy.mockRestore();
    });
});
