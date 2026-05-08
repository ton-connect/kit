/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import { getCacheKey } from './get-cache-key';

describe('getCacheKey', () => {
    it('should build a key with a single param', () => {
        const key = getCacheKey('jetton-info');
        expect(key('EQabc')).toBe('jetton-info:EQabc');
    });

    it('should build a key with multiple params', () => {
        const key = getCacheKey('jetton-info');
        expect(key('mainnet', 'EQabc')).toBe('jetton-info:mainnet:EQabc');
    });

    it('should build a key with no params', () => {
        const key = getCacheKey('jetton-info');
        expect(key()).toBe('jetton-info:');
    });

    it('should scope keys independently per prefix', () => {
        const infoKey = getCacheKey('jetton-info');
        const walletKey = getCacheKey('jetton-wallet');
        expect(infoKey('EQabc')).not.toBe(walletKey('EQabc'));
    });
});
