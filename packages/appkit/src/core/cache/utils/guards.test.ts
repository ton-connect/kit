/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect } from 'vitest';

import { isFunction, isPlainObject, isNullOrUndefined } from './guards';

describe('Guards', () => {
    describe('isFunction', () => {
        it('should return true for functions', () => {
            expect(isFunction(() => {})).toBe(true);
            expect(isFunction(async () => {})).toBe(true);
            expect(isFunction(function () {})).toBe(true);
        });

        it('should return false for non-functions', () => {
            expect(isFunction(null)).toBe(false);
            expect(isFunction(undefined)).toBe(false);
            expect(isFunction({})).toBe(false);
            expect(isFunction([])).toBe(false);
            expect(isFunction('string')).toBe(false);
            expect(isFunction(123)).toBe(false);
        });
    });

    describe('isNullOrUndefined', () => {
        it('should return true for null or undefined', () => {
            expect(isNullOrUndefined(null)).toBe(true);
            expect(isNullOrUndefined(undefined)).toBe(true);
        });

        it('should return false for other values', () => {
            expect(isNullOrUndefined(false)).toBe(false);
            expect(isNullOrUndefined(0)).toBe(false);
            expect(isNullOrUndefined('')).toBe(false);
            expect(isNullOrUndefined({})).toBe(false);
            expect(isNullOrUndefined([])).toBe(false);
        });
    });

    describe('isPlainObject', () => {
        it('should return true for plain objects', () => {
            expect(isPlainObject({})).toBe(true);
            expect(isPlainObject({ key: 'value' })).toBe(true);
        });

        it('should return false for non-plain objects', () => {
            expect(isPlainObject(null)).toBe(false);
            expect(isPlainObject(undefined)).toBe(false);
            expect(isPlainObject([])).toBe(false);
            expect(isPlainObject('string')).toBe(false);
            expect(isPlainObject(123)).toBe(false);
            expect(isPlainObject(new Date())).toBe(true); // typeof new Date() is object, and !isArray
        });
    });
});
