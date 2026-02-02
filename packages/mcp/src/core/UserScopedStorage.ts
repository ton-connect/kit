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

import type { IStorageAdapter } from '../types/storage.js';

/**
 * User-scoped storage wrapper.
 * Automatically prefixes all keys with user namespace.
 */
export class UserScopedStorage {
    private readonly storage: IStorageAdapter;
    private readonly userId: string;
    private readonly prefix: string;

    constructor(storage: IStorageAdapter, userId: string) {
        this.storage = storage;
        this.userId = userId;
        this.prefix = `user:${userId}:`;
    }

    /**
     * Get the user ID this storage is scoped to
     */
    getUserId(): string {
        return this.userId;
    }

    /**
     * Build full key with user prefix
     */
    private buildKey(key: string): string {
        return `${this.prefix}${key}`;
    }

    /**
     * Strip user prefix from a key
     */
    private stripPrefix(fullKey: string): string {
        if (fullKey.startsWith(this.prefix)) {
            return fullKey.slice(this.prefix.length);
        }
        return fullKey;
    }

    /**
     * Get a value by key (user-scoped)
     */
    async get<T>(key: string): Promise<T | null> {
        return this.storage.get<T>(this.buildKey(key));
    }

    /**
     * Set a value (user-scoped)
     */
    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        return this.storage.set<T>(this.buildKey(key), value, ttlSeconds);
    }

    /**
     * Delete a key (user-scoped)
     */
    async delete(key: string): Promise<boolean> {
        return this.storage.delete(this.buildKey(key));
    }

    /**
     * List keys matching prefix (user-scoped)
     * Returns keys with user prefix stripped.
     */
    async list(subPrefix: string): Promise<string[]> {
        const fullPrefix = this.buildKey(subPrefix);
        const keys = await this.storage.list(fullPrefix);
        return keys.map((k) => this.stripPrefix(k));
    }

    /**
     * Get the underlying storage adapter.
     * Use with caution - bypasses user isolation.
     */
    getUnderlyingStorage(): IStorageAdapter {
        return this.storage;
    }
}
