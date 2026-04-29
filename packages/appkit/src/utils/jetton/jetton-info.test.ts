/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import { isJettonInfo } from './jetton-info';

describe('isJettonInfo', () => {
    it('should return true for a valid JettonInfo object', () => {
        expect(
            isJettonInfo({
                address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
                name: 'Tether USD',
                symbol: 'USDT',
                description: 'Tether USD stablecoin',
            }),
        ).toBe(true);
    });

    it('should return true when optional fields are present', () => {
        expect(
            isJettonInfo({
                address: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
                name: 'Tether USD',
                symbol: 'USDT',
                description: 'Tether USD stablecoin',
                decimals: 6,
                image: 'https://example.com/image.png',
                uri: 'https://example.com/meta.json',
            }),
        ).toBe(true);
    });

    it('should return false for null', () => {
        expect(isJettonInfo(null)).toBe(false);
    });

    it('should return false for primitives', () => {
        expect(isJettonInfo('string')).toBe(false);
        expect(isJettonInfo(42)).toBe(false);
        expect(isJettonInfo(true)).toBe(false);
        expect(isJettonInfo(undefined)).toBe(false);
    });

    it('should return false when required string fields are missing', () => {
        expect(isJettonInfo({ name: 'Test', symbol: 'TST', description: 'desc' })).toBe(false);
        expect(isJettonInfo({ address: 'EQ...', symbol: 'TST', description: 'desc' })).toBe(false);
        expect(isJettonInfo({ address: 'EQ...', name: 'Test', description: 'desc' })).toBe(false);
        expect(isJettonInfo({ address: 'EQ...', name: 'Test', symbol: 'TST' })).toBe(false);
    });

    it('should return false when required fields are not strings', () => {
        expect(isJettonInfo({ address: 1, name: 'Test', symbol: 'TST', description: 'desc' })).toBe(false);
        expect(isJettonInfo({ address: 'EQ...', name: null, symbol: 'TST', description: 'desc' })).toBe(false);
    });

    it('should return false for an empty object', () => {
        expect(isJettonInfo({})).toBe(false);
    });
});
