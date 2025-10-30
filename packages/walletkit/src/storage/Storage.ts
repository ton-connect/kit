/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StorageAdapter } from './types';
import { globalLogger } from '../core/Logger';

const log = globalLogger.createChild('Storage');

/**
 * High-level storage interface with generic type support
 * Wraps StorageAdapter to provide type-safe get/set operations
 */
export class Storage {
    private adapter: StorageAdapter;

    constructor(adapter: StorageAdapter) {
        this.adapter = adapter;
    }

    /**
     * Get a value from storage by key
     * @param key The storage key
     * @returns The stored value, or null if not found
     */
    async get<T>(key: string): Promise<T | null> {
        try {
            const value = await this.adapter.get(key);
            if (value === null) {
                return null;
            }
            return JSON.parse(value) as T;
        } catch (error) {
            log.warn('Failed to parse stored value', { key, error });
            return null;
        }
    }

    /**
     * Set a value in storage
     * @param key The storage key
     * @param value The value to store (will be JSON serialized)
     */
    async set<T>(key: string, value: T): Promise<void> {
        try {
            const serialized = JSON.stringify(value);
            await this.adapter.set(key, serialized);
        } catch (error) {
            log.error('Failed to serialize value for storage', { key, error });
            throw error;
        }
    }

    /**
     * Remove a value from storage
     * @param key The storage key to remove
     */
    async remove(key: string): Promise<void> {
        await this.adapter.remove(key);
    }

    /**
     * Clear all storage data
     */
    async clear(): Promise<void> {
        await this.adapter.clear();
    }

    /**
     * Get the underlying storage adapter
     * @returns The StorageAdapter instance
     */
    getAdapter(): StorageAdapter {
        return this.adapter;
    }
}
