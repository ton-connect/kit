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
    it('should return undefined for a missing key', async () => {
        const cache = new LruAppKitCache();
        expect(await cache.get('missing')).toBeUndefined();
    });

    it('should store and retrieve a value', async () => {
        const cache = new LruAppKitCache();
        await cache.set('key', 'value');
        expect(await cache.get('key')).toBe('value');
    });

    it('should store and retrieve null', async () => {
        const cache = new LruAppKitCache();
        await cache.set('key', null);
        expect(await cache.get('key')).toBeNull();
    });

    it('should store and retrieve an object', async () => {
        const cache = new LruAppKitCache();
        const obj = { address: 'EQabc', name: 'Test', decimals: 6 };
        await cache.set('key', obj);
        expect(await cache.get('key')).toEqual(obj);
    });

    it('should overwrite an existing value', async () => {
        const cache = new LruAppKitCache();
        await cache.set('key', 'first');
        await cache.set('key', 'second');
        expect(await cache.get('key')).toBe('second');
    });

    it('should remove a key', async () => {
        const cache = new LruAppKitCache();
        await cache.set('key', 'value');
        await cache.remove('key');
        expect(await cache.get('key')).toBeUndefined();
    });

    it('should clear all keys', async () => {
        const cache = new LruAppKitCache();
        await cache.set('a', 1);
        await cache.set('b', 2);
        await cache.clear();
        expect(await cache.get('a')).toBeUndefined();
        expect(await cache.get('b')).toBeUndefined();
    });

    it('should evict entries when max is exceeded', async () => {
        const cache = new LruAppKitCache({ max: 2 });
        await cache.set('a', 1);
        await cache.set('b', 2);
        await cache.set('c', 3);
        expect(await cache.get('a')).toBeUndefined();
        expect(await cache.get('b')).toBe(2);
        expect(await cache.get('c')).toBe(3);
    });

    it('should expire entries after ttl', async () => {
        const cache = new LruAppKitCache({ ttl: 10 });
        await cache.set('key', 'value');
        await new Promise((resolve) => setTimeout(resolve, 20));
        expect(await cache.get('key')).toBeUndefined();
    });
});
