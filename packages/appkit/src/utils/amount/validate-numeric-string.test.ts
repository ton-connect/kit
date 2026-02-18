/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import { validateNumericString } from './validate-numeric-string';

describe('validateNumericString', () => {
    it('should validate integers', () => {
        expect(validateNumericString('123')).toBe(true);
        expect(validateNumericString('0')).toBe(true);
    });

    it('should validate floats with dot', () => {
        expect(validateNumericString('1.23')).toBe(true);
        expect(validateNumericString('0.1')).toBe(true);
        expect(validateNumericString('1.')).toBe(true);
        expect(validateNumericString('.1')).toBe(true);
    });

    it('should validate floats with comma', () => {
        expect(validateNumericString('1,23')).toBe(true);
        expect(validateNumericString('0,1')).toBe(true);
    });

    it('should reject invalid characters', () => {
        expect(validateNumericString('1a')).toBe(false);
        expect(validateNumericString('abc')).toBe(false);
        expect(validateNumericString('1.2.3')).toBe(false);
        expect(validateNumericString(' ')).toBe(false);
    });

    it('should validate max decimals', () => {
        expect(validateNumericString('1.23', 2)).toBe(true);
        expect(validateNumericString('1.234', 2)).toBe(false);
        expect(validateNumericString('1.23', 1)).toBe(false);
    });

    it('should handle 0 max decimals', () => {
        expect(validateNumericString('123', 0)).toBe(true);
        expect(validateNumericString('1.2', 0)).toBe(false);
    });

    it('should reject pure dot regardless', () => {
        expect(validateNumericString('.')).toBe(false);
        expect(validateNumericString(',')).toBe(false);
    });
});
