/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it } from 'vitest';

import { LruAppKitCache } from './lru-app-kit-cache';

describe('LruAppKitCache', () => {
    it('should return undefined for a missing key', () => {
        const cache = new LruAppKitCache();
        expect(cache.get('missing')).toBeUndefined();
    });

    it('should store and retrieve a value', () => {
        const cache = new LruAppKitCache();
        cache.set('key', 'value');
        expect(cache.get('key')).toBe('value');
    });

    it('should store and retrieve null', () => {
        const cache = new LruAppKitCache();
        cache.set('key', null);
        expect(cache.get('key')).toBeNull();
    });

    it('should store and retrieve an object', () => {
        const cache = new LruAppKitCache();
        const obj = { address: 'EQabc', name: 'Test', decimals: 6 };
        cache.set('key', obj);
        expect(cache.get('key')).toEqual(obj);
    });

    it('should overwrite an existing value', () => {
        const cache = new LruAppKitCache();
        cache.set('key', 'first');
        cache.set('key', 'second');
        expect(cache.get('key')).toBe('second');
    });

    it('should remove a key', () => {
        const cache = new LruAppKitCache();
        cache.set('key', 'value');
        cache.remove('key');
        expect(cache.get('key')).toBeUndefined();
    });

    it('should clear all keys', () => {
        const cache = new LruAppKitCache();
        cache.set('a', 1);
        cache.set('b', 2);
        cache.clear();
        expect(cache.get('a')).toBeUndefined();
        expect(cache.get('b')).toBeUndefined();
    });

    it('should evict entries when max is exceeded', () => {
        const cache = new LruAppKitCache({ max: 2 });
        cache.set('a', 1);
        cache.set('b', 2);
        cache.set('c', 3);
        expect(cache.get('a')).toBeUndefined();
        expect(cache.get('b')).toBe(2);
        expect(cache.get('c')).toBe(3);
    });

    it('should expire entries after ttl', async () => {
        const cache = new LruAppKitCache({ ttl: 10 });
        cache.set('key', 'value');
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(cache.get('key')).toBeUndefined();
    });
});
