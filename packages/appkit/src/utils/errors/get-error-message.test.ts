/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import { getErrorMessage } from './get-error-message';

describe('getErrorMessage', () => {
    it('should return error message from Error object', () => {
        const error = new Error('Something went wrong');
        expect(getErrorMessage(error)).toBe('Something went wrong');
    });

    it('should return string error directly', () => {
        const error = 'Something went wrong';
        expect(getErrorMessage(error)).toBe('Something went wrong');
    });

    it('should return message from object with message property', () => {
        const error = { message: 'Something went wrong' };
        expect(getErrorMessage(error)).toBe('Something went wrong');
    });

    it('should return default message if error is unknown object', () => {
        const error = { foo: 'bar' };
        expect(getErrorMessage(error, 'Default Message')).toBe('Default Message');
        expect(getErrorMessage(error)).toBe('Error occurred');
    });

    it('should return default message if error is null/undefined', () => {
        expect(getErrorMessage(null)).toBe('Error occurred');
        expect(getErrorMessage(undefined)).toBe('Error occurred');
    });
});
