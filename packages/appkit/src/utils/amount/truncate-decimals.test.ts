/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import { truncateDecimals } from './truncate-decimals';

describe('truncateDecimals', () => {
    it('should return integers unchanged', () => {
        expect(truncateDecimals('123', 2)).toBe('123');
        expect(truncateDecimals('0', 5)).toBe('0');
    });

    it('should truncate decimals exceeding maxDecimals', () => {
        expect(truncateDecimals('1.23456', 2)).toBe('1.23');
        expect(truncateDecimals('1.23456', 4)).toBe('1.2345');
        expect(truncateDecimals('0.123456789', 9)).toBe('0.123456789');
        expect(truncateDecimals('0.1234567890', 9)).toBe('0.123456789');
    });

    it('should return value unchanged when decimals are within limit', () => {
        expect(truncateDecimals('1.23', 5)).toBe('1.23');
        expect(truncateDecimals('1.2', 2)).toBe('1.2');
        expect(truncateDecimals('5.0', 1)).toBe('5.0');
    });

    it('should handle maxDecimals of 0', () => {
        expect(truncateDecimals('1.999', 0)).toBe('1');
        expect(truncateDecimals('42.1', 0)).toBe('42');
    });

    it('should strip trailing dot', () => {
        expect(truncateDecimals('1.', 3)).toBe('1');
        expect(truncateDecimals('1.', 0)).toBe('1');
    });

    it('should handle empty string', () => {
        expect(truncateDecimals('', 2)).toBe('');
    });

    it('should handle number input', () => {
        expect(truncateDecimals(1.23456, 2)).toBe('1.23');
        expect(truncateDecimals(42, 3)).toBe('42');
        expect(truncateDecimals(0.1, 5)).toBe('0.1');
        expect(truncateDecimals(3.14159, 0)).toBe('3');
    });

    it('should handle scientific notation strings', () => {
        expect(truncateDecimals('1.095492908209088e-9', 9)).toBe('0.000000001');
        expect(truncateDecimals('5e-7', 9)).toBe('0.0000005');
    });

    it('should handle numbers that produce scientific notation', () => {
        const tiny = 0.000000001 * 1.095492908209088; // 1.095492908209088e-9
        expect(truncateDecimals(tiny, 9)).toBe('0.000000001');
    });

    it('should handle negative numbers and negative scientific notation', () => {
        expect(truncateDecimals('-1.23456', 2)).toBe('-1.23');
        expect(truncateDecimals('-5e-7', 9)).toBe('-0.0000005');
        expect(truncateDecimals(-0.0000005, 9)).toBe('-0.0000005');
    });

    it('should handle scientific notation with positive exponents', () => {
        expect(truncateDecimals('1.2345e2', 2)).toBe('123.45');
        expect(truncateDecimals('1.2345e+2', 0)).toBe('123');
        expect(truncateDecimals('5.2e9', 0)).toBe('5200000000');
        expect(truncateDecimals('-1.23e+9', 0)).toBe('-1230000000');
    });

    it('should handle extreme scientific exponents', () => {
        expect(truncateDecimals('1e-100', 100)).toBe('0.' + '0'.repeat(99) + '1');
        expect(truncateDecimals('1e21', 0)).toBe('1000000000000000000000');
    });

    it('should handle NaN and Infinity', () => {
        expect(truncateDecimals(NaN, 2)).toBe('NaN');
        expect(truncateDecimals(Infinity, 2)).toBe('Infinity');
        expect(truncateDecimals(-Infinity, 2)).toBe('-Infinity');
        expect(truncateDecimals('NaN', 2)).toBe('NaN');
        expect(truncateDecimals('Infinity', 2)).toBe('Infinity');
    });

    it('should handle native numbers with e (scientific notation)', () => {
        expect(truncateDecimals(1e-10, 10)).toBe('0.0000000001');
        expect(truncateDecimals(1.23e-8, 10)).toBe('0.0000000123');
        expect(truncateDecimals(-5.43e-7, 9)).toBe('-0.000000543');
        expect(truncateDecimals(5.2e9, 0)).toBe('5200000000');
        expect(truncateDecimals(-1.23e9, 0)).toBe('-1230000000');
        expect(truncateDecimals(1e21, 0)).toBe('1000000000000000000000');
    });
});
