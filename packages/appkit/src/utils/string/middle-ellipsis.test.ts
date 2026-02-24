/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import { middleEllipsis } from './middle-ellipsis';

describe('middleEllipsis', () => {
    it('should truncate string in the middle', () => {
        const str = '1234567890abcdef';
        const result = middleEllipsis(str, 4, 4);
        expect(result).toBe('1234...cdef');
    });

    it('should use default values (5, 5)', () => {
        const str = '123456789012345';
        const result = middleEllipsis(str);
        expect(result).toBe('12345...12345');
    });

    it('should handle short strings gracefully', () => {
        expect(middleEllipsis('abc')).toBe('abc');
    });

    it('should handle uneven split', () => {
        expect(middleEllipsis('abcdefgh', 2, 3)).toBe('ab...fgh');
    });
});
