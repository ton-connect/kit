/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect } from 'vitest';

import { passThrough } from './misc';

describe('passThrough', () => {
    it('should return the given value', () => {
        const noop = () => {};

        expect(passThrough(null)).toBe(null);
        expect(passThrough(undefined)).toBe(undefined);
        expect(passThrough(0)).toBe(0);
        expect(passThrough('')).toBe('');
        expect(passThrough({})).toEqual({});
        expect(passThrough([])).toEqual([]);
        expect(passThrough(noop)).toEqual(noop);
    });
});
