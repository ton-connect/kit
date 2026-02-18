/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import { formatUnits, parseUnits } from './units';

describe('units', () => {
    describe('parseUnits', () => {
        it('should parse simple integers', () => {
            expect(parseUnits('1', 0)).toBe(1n);
            expect(parseUnits('1', 9)).toBe(1000000000n);
            expect(parseUnits('420', 9)).toBe(420000000000n);
        });

        it('should parse decimals', () => {
            expect(parseUnits('0.1', 1)).toBe(1n);
            expect(parseUnits('0.1', 9)).toBe(100000000n);
            expect(parseUnits('1.23', 2)).toBe(123n);
        });

        it('should handle negative numbers', () => {
            expect(parseUnits('-1', 0)).toBe(-1n);
            expect(parseUnits('-0.5', 1)).toBe(-5n);
        });

        it('should pad with zeros', () => {
            expect(parseUnits('1', 3)).toBe(1000n);
        });

        it('should trim extra decimals if needed (round)', () => {
            // function uses Math.round logic
            // 1.234, 2 decimals -> 1.23 -> 123
            expect(parseUnits('1.234', 2)).toBe(123n);
            // 1.236, 2 decimals -> 1.24 -> 124
            expect(parseUnits('1.236', 2)).toBe(124n);
        });
    });

    describe('formatUnits', () => {
        it('should format simple integers', () => {
            expect(formatUnits(1000000000n, 9)).toBe('1');
            expect(formatUnits(420000000000n, 9)).toBe('420');
        });

        it('should format decimals', () => {
            expect(formatUnits(100000000n, 9)).toBe('0.1');
            expect(formatUnits(123n, 2)).toBe('1.23');
        });

        it('should handle negative numbers', () => {
            expect(formatUnits(-1000000000n, 9)).toBe('-1');
            expect(formatUnits(-123n, 2)).toBe('-1.23');
        });

        it('should remove trailing zeros', () => {
            expect(formatUnits(1500000000n, 9)).toBe('1.5');
        });

        it('should handle small numbers', () => {
            expect(formatUnits(1n, 9)).toBe('0.000000001');
        });

        it('should handle zero', () => {
            expect(formatUnits(0n, 9)).toBe('0');
        });
    });
});
