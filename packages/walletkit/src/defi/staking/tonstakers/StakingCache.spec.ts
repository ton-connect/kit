/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { StakingCache } from './StakingCache';

describe('StakingCache', () => {
    let cache: StakingCache;

    beforeEach(() => {
        cache = new StakingCache();
    });

    describe('get', () => {
        it('should return cached value if exists', async () => {
            const fetcher = vi.fn().mockResolvedValue('value1');

            const result1 = await cache.get('key1', fetcher);
            const result2 = await cache.get('key1', fetcher);

            expect(result1).toBe('value1');
            expect(result2).toBe('value1');
            expect(fetcher).toHaveBeenCalledTimes(1);
        });

        it('should call fetcher if value not cached', async () => {
            const fetcher = vi.fn().mockResolvedValue('fetched-value');

            const result = await cache.get('new-key', fetcher);

            expect(result).toBe('fetched-value');
            expect(fetcher).toHaveBeenCalledTimes(1);
        });

        it('should cache fetched value', async () => {
            const fetcher1 = vi.fn().mockResolvedValue('first');
            const fetcher2 = vi.fn().mockResolvedValue('second');

            await cache.get('key', fetcher1);
            const result = await cache.get('key', fetcher2);

            expect(result).toBe('first');
            expect(fetcher2).not.toHaveBeenCalled();
        });
    });

    describe('clear', () => {
        it('should clear all cached values', async () => {
            const fetcher1 = vi.fn().mockResolvedValue('value1');
            const fetcher2 = vi.fn().mockResolvedValue('value2');

            await cache.get('key1', fetcher1);
            await cache.get('key2', fetcher2);

            cache.clear();

            const newFetcher1 = vi.fn().mockResolvedValue('new-value1');
            const newFetcher2 = vi.fn().mockResolvedValue('new-value2');

            const result1 = await cache.get('key1', newFetcher1);
            const result2 = await cache.get('key2', newFetcher2);

            expect(result1).toBe('new-value1');
            expect(result2).toBe('new-value2');
            expect(newFetcher1).toHaveBeenCalledTimes(1);
            expect(newFetcher2).toHaveBeenCalledTimes(1);
        });
    });

    describe('invalidate', () => {
        it('should remove specific key', async () => {
            const fetcher1 = vi.fn().mockResolvedValue('value1');
            const fetcher2 = vi.fn().mockResolvedValue('value2');

            await cache.get('key1', fetcher1);
            await cache.get('key2', fetcher2);

            cache.invalidate('key1');

            const newFetcher1 = vi.fn().mockResolvedValue('new-value1');
            const newFetcher2 = vi.fn().mockResolvedValue('new-value2');

            const result1 = await cache.get('key1', newFetcher1);
            const result2 = await cache.get('key2', newFetcher2);

            expect(result1).toBe('new-value1');
            expect(result2).toBe('value2');
            expect(newFetcher1).toHaveBeenCalledTimes(1);
            expect(newFetcher2).not.toHaveBeenCalled();
        });
    });
});
