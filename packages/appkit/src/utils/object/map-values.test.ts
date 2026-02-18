/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import { mapValues } from './map-values';

describe('mapValues', () => {
    it('should map values of object', () => {
        const obj = { a: 1, b: 2 };
        const result = mapValues(obj, (value) => value * 2);
        expect(result).toEqual({ a: 2, b: 4 });
    });

    it('should provide key in callback', () => {
        const obj = { a: 1, b: 2 };
        const result = mapValues(obj, (value, key) => `${key}:${value}`);
        expect(result).toEqual({ a: 'a:1', b: 'b:2' });
    });

    it('should handle empty object', () => {
        const obj = {};
        const result = mapValues(obj, (value) => value);
        expect(result).toEqual({});
    });

    it('should not mutate original object', () => {
        const obj = { a: 1 };
        mapValues(obj, (val) => val + 1);
        expect(obj).toEqual({ a: 1 });
    });
});
