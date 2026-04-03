/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect } from 'vitest';

import { formatLargeValue } from './format-large-value';

describe('formatLargeValue', () => {
    it('should format trillion values', () => {
        expect(formatLargeValue('1000000000000')).toBe('1T');
        expect(formatLargeValue('1230000000000')).toBe('1.23T');
        expect(formatLargeValue('12345678901234')).toBe('12.34T');
    });

    it('should format billion values', () => {
        expect(formatLargeValue('1000000000')).toBe('1B');
        expect(formatLargeValue('1230000000')).toBe('1.23B');
    });

    it('should format million values', () => {
        expect(formatLargeValue('1000000')).toBe('1M');
        expect(formatLargeValue('1230000')).toBe('1.23M');
    });

    it('should format smaller values using toLocaleString', () => {
        expect(formatLargeValue('1234.56')).toBe('1,234.56');
        expect(formatLargeValue('100')).toBe('100');
        expect(formatLargeValue('0')).toBe('0');
    });

    it('should handle spaces and formatting', () => {
        expect(formatLargeValue('1 000 000')).toBe('1M');
    });

    it('should respect decimals for small values', () => {
        expect(formatLargeValue('1234.5678', 4)).toBe('1,234.5678');
        expect(formatLargeValue('1234.5678', 2)).toBe('1,234.56');
    });
});
