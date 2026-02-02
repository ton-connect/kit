/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * IStorageAdapter - Interface for persistent key-value storage
 *
 * Purpose: Store wallet metadata, contacts, transaction history, pending transactions.
 * Does NOT store: private keys, seed phrases (that's ISignerAdapter's responsibility)
 */
export interface IStorageAdapter {
    /**
     * Get a value by key
     * @param key - The storage key
     * @returns The stored value or null if not found
     */
    get<T>(key: string): Promise<T | null>;

    /**
     * Set a value with optional TTL
     * @param key - The storage key
     * @param value - The value to store
     * @param ttlSeconds - Optional time-to-live in seconds (for pending transactions, etc.)
     */
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;

    /**
     * Delete a key
     * @param key - The storage key
     * @returns true if the key existed and was deleted, false otherwise
     */
    delete(key: string): Promise<boolean>;

    /**
     * List all keys matching a prefix
     * @param prefix - The key prefix to match
     * @returns Array of matching keys
     */
    list(prefix: string): Promise<string[]>;
}
