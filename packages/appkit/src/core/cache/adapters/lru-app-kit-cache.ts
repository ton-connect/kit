/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { LRUCache } from 'lru-cache';

import type { AppKitCache } from '../types/app-kit-cache';

export class LruAppKitCache implements AppKitCache {
    private readonly cache: LRUCache<string, { value: unknown }>;

    constructor(options?: { max?: number; ttl?: number }) {
        this.cache = new LRUCache({
            max: options?.max ?? 1000,
            ttl: options?.ttl ?? 1000 * 60 * 10,
        });
    }

    get<T = unknown>(key: string): T | undefined {
        return this.cache.get(key)?.value as T | undefined;
    }

    set(key: string, value: unknown): void {
        this.cache.set(key, { value });
    }

    remove(key: string): void {
        this.cache.delete(key);
    }

    clear(): void {
        this.cache.clear();
    }
}
