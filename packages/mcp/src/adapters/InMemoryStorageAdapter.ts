/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * InMemoryStorageAdapter - Simple in-memory storage for testing and development
 *
 * Features:
 * - Map-based storage
 * - TTL support via setTimeout
 * - Not persistent - data lost on restart
 */

import type { IStorageAdapter } from '../types/storage.js';

/**
 * In-memory storage adapter for testing and development.
 * Data is not persistent and will be lost on process restart.
 */
export class InMemoryStorageAdapter implements IStorageAdapter {
    private data: Map<string, unknown> = new Map();
    private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();

    /**
     * Get a value by key
     */
    async get<T>(key: string): Promise<T | null> {
        const value = this.data.get(key);
        return (value as T) ?? null;
    }

    /**
     * Set a value with optional TTL
     */
    async set<T>(key: string, value: T, ttlSeconds?: number): Promise<void> {
        // Clear existing timer if any
        const existingTimer = this.timers.get(key);
        if (existingTimer) {
            clearTimeout(existingTimer);
            this.timers.delete(key);
        }

        this.data.set(key, value);

        // Set up TTL if specified
        if (ttlSeconds !== undefined && ttlSeconds > 0) {
            const timer = setTimeout(() => {
                this.data.delete(key);
                this.timers.delete(key);
            }, ttlSeconds * 1000);

            this.timers.set(key, timer);
        }
    }

    /**
     * Delete a key
     */
    async delete(key: string): Promise<boolean> {
        // Clear timer if exists
        const timer = this.timers.get(key);
        if (timer) {
            clearTimeout(timer);
            this.timers.delete(key);
        }

        return this.data.delete(key);
    }

    /**
     * List keys matching prefix
     */
    async list(prefix: string): Promise<string[]> {
        const keys: string[] = [];
        for (const key of this.data.keys()) {
            if (key.startsWith(prefix)) {
                keys.push(key);
            }
        }
        return keys;
    }

    /**
     * Clear all data (useful for testing)
     */
    clear(): void {
        // Clear all timers
        for (const timer of this.timers.values()) {
            clearTimeout(timer);
        }
        this.timers.clear();
        this.data.clear();
    }

    /**
     * Get the number of stored items (useful for testing)
     */
    size(): number {
        return this.data.size;
    }
}
