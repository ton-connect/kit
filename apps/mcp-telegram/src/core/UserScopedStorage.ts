/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * UserScopedStorage - Wraps IStorageAdapter with user namespace isolation
 *
 * All storage keys are prefixed with user:{userId}: to ensure
 * User A cannot access User B's data.
 */

import type { IStorageAdapter } from '../adapters/index.js';

/**
 * User-scoped storage wrapper.
 * Automatically prefixes all keys with user namespace.
 */
export class UserScopedStorage implements IStorageAdapter {
    private readonly storage: IStorageAdapter;
    private readonly prefix: string;

    constructor(storage: IStorageAdapter, userId: string) {
        this.storage = storage;
        this.prefix = `user:${userId}:`;
    }

    private buildKey(key: string): string {
        return `${this.prefix}${key}`;
    }

    private stripPrefix(fullKey: string): string {
        if (fullKey.startsWith(this.prefix)) {
            return fullKey.slice(this.prefix.length);
        }
        return fullKey;
    }

    async get<T>(key: string): Promise<T | null> {
        return this.storage.get<T>(this.buildKey(key));
    }

    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        return this.storage.set<T>(this.buildKey(key), value, ttlSeconds);
    }

    async delete(key: string): Promise<boolean> {
        return this.storage.delete(this.buildKey(key));
    }

    async list(subPrefix: string): Promise<string[]> {
        const fullPrefix = this.buildKey(subPrefix);
        const keys = await this.storage.list(fullPrefix);
        return keys.map((k) => this.stripPrefix(k));
    }
}
