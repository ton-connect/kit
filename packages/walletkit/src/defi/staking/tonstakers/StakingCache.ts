/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { LRUCache } from 'lru-cache';

import { TIMING } from './constants';

export class StakingCache {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private cache: LRUCache<string, any>;
    private readonly defaultTtl: number;

    constructor(maxSize: number = 100, defaultTtl: number = TIMING.CACHE_TIMEOUT) {
        this.defaultTtl = defaultTtl;
        this.cache = new LRUCache({
            max: maxSize,
        });
    }

    async get<T>(key: string, fetcher: () => Promise<T>, ttl: number = this.defaultTtl): Promise<T> {
        const cached = this.cache.get(key);
        if (cached !== undefined) {
            return cached as T;
        }

        const value = await fetcher();
        this.cache.set(key, value, { ttl });
        return value;
    }

    clear(): void {
        this.cache.clear();
    }

    invalidate(key: string): void {
        this.cache.delete(key);
    }
}
