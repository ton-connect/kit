/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import { isString } from './is-string';

describe('isString', () => {
    it('should return true for strings', () => {
        expect(isString('hello')).toBe(true);
        expect(isString('')).toBe(true);
        expect(isString(String('hello'))).toBe(true);
    });

    it('should return false for non-strings', () => {
        expect(isString(123)).toBe(false);
        expect(isString(true)).toBe(false);
        expect(isString({})).toBe(false);
        expect(isString([])).toBe(false);
        expect(isString(null)).toBe(false);
        expect(isString(undefined)).toBe(false);
        expect(isString(Symbol('sym'))).toBe(false);
    });
});
