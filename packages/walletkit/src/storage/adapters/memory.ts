/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { StorageAdapter, StorageConfig } from '../types';

/**
 * In-memory storage adapter for testing and temporary storage
 */
export class MemoryStorageAdapter implements StorageAdapter {
    private store: Map<string, string> = new Map();
    private prefix: string;

    constructor(config: StorageConfig = {}) {
        this.prefix = config.prefix || '';
    }

    async get(key: string): Promise<string | null> {
        const fullKey = this.prefix + key;
        return this.store.has(fullKey) ? this.store.get(fullKey)! : null;
    }

    async set(key: string, value: string): Promise<void> {
        const fullKey = this.prefix + key;
        this.store.set(fullKey, value);
    }

    async remove(key: string): Promise<void> {
        const fullKey = this.prefix + key;
        this.store.delete(fullKey);
    }

    async clear(): Promise<void> {
        if (this.prefix) {
            // Clear only prefixed keys
            const keysToDelete = Array.from(this.store.keys()).filter((key) => key.startsWith(this.prefix));
            keysToDelete.forEach((key) => this.store.delete(key));
        } else {
            // Clear all keys
            this.store.clear();
        }
    }

    /**
     * Get current store size (for testing/debugging)
     */
    getSize(): number {
        return this.store.size;
    }

    /**
     * Get all keys (for testing/debugging)
     */
    getKeys(): string[] {
        return Array.from(this.store.keys());
    }
}
