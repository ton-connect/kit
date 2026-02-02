/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { InMemoryStorageAdapter } from '../adapters/InMemoryStorageAdapter.js';

describe('InMemoryStorageAdapter', () => {
    let storage: InMemoryStorageAdapter;

    beforeEach(() => {
        storage = new InMemoryStorageAdapter();
    });

    it('should store and retrieve values', async () => {
        await storage.set('key1', { name: 'test', value: 42 });
        const result = await storage.get<{ name: string; value: number }>('key1');

        expect(result).toEqual({ name: 'test', value: 42 });
    });

    it('should return null for non-existent keys', async () => {
        const result = await storage.get('nonexistent');
        expect(result).toBeNull();
    });

    it('should delete keys', async () => {
        await storage.set('key1', 'value1');
        const deleted = await storage.delete('key1');

        expect(deleted).toBe(true);
        expect(await storage.get('key1')).toBeNull();
    });

    it('should return false when deleting non-existent keys', async () => {
        const deleted = await storage.delete('nonexistent');
        expect(deleted).toBe(false);
    });

    it('should list keys by prefix', async () => {
        await storage.set('user:1:wallet:a', 'data1');
        await storage.set('user:1:wallet:b', 'data2');
        await storage.set('user:2:wallet:a', 'data3');

        const user1Keys = await storage.list('user:1:');
        expect(user1Keys).toHaveLength(2);
        expect(user1Keys).toContain('user:1:wallet:a');
        expect(user1Keys).toContain('user:1:wallet:b');

        const user2Keys = await storage.list('user:2:');
        expect(user2Keys).toHaveLength(1);
        expect(user2Keys).toContain('user:2:wallet:a');
    });

    it('should handle TTL (values should expire)', async () => {
        // Set with 1 second TTL
        await storage.set('expiring', 'value', 1);

        // Should exist immediately
        expect(await storage.get('expiring')).toBe('value');

        // Wait for expiration
        await new Promise((resolve) => setTimeout(resolve, 1100));

        // Should be expired
        expect(await storage.get('expiring')).toBeNull();
    });

    it('should clear all data', () => {
        storage.clear();
        expect(storage.size()).toBe(0);
    });
});
