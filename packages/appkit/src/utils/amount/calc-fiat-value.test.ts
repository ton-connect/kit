/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect } from 'vitest';

import { calcFiatValue } from './calc-fiat-value';

describe('calcFiatValue', () => {
    it('should return 0 when rate is undefined', () => {
        expect(calcFiatValue('100', undefined)).toBe('0');
    });

    it('should return 0 when rate is 0', () => {
        expect(calcFiatValue('100', '0')).toBe('0');
    });

    it('should return 0 when amount is 0', () => {
        expect(calcFiatValue('0', '1.5')).toBe('0');
    });

    it('should return 0 when amount is negative', () => {
        expect(calcFiatValue('-10', '1.5')).toBe('0');
    });

    it('should return 0 when amount is not a valid number', () => {
        expect(calcFiatValue('abc', '1.5')).toBe('0');
        expect(calcFiatValue('', '1.5')).toBe('0');
    });

    it('should calculate fiat value rounded to 2 decimal places', () => {
        expect(calcFiatValue('100', '1.5')).toBe('150');
        expect(calcFiatValue('1', '0.001')).toBe('0');
        expect(calcFiatValue('10', '1.005')).toBe('10.05');
    });

    it('should handle decimal amounts rounded to 2 decimal places', () => {
        expect(calcFiatValue('0.5', '2')).toBe('1');
        expect(calcFiatValue('1.23456', '100')).toBe('123.46');
        expect(calcFiatValue('2.994', '1')).toBe('2.99');
    });
});
