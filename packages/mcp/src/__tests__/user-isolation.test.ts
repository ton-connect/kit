/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, beforeEach } from 'vitest';

import { InMemoryStorageAdapter } from '../adapters/InMemoryStorageAdapter.js';
import { UserScopedStorage } from '../core/UserScopedStorage.js';

describe('UserScopedStorage', () => {
    let baseStorage: InMemoryStorageAdapter;
    let user1Storage: UserScopedStorage;
    let user2Storage: UserScopedStorage;

    beforeEach(() => {
        baseStorage = new InMemoryStorageAdapter();
        user1Storage = new UserScopedStorage(baseStorage, 'user1');
        user2Storage = new UserScopedStorage(baseStorage, 'user2');
    });

    describe('User isolation', () => {
        it('should isolate data between users', async () => {
            // User 1 stores data
            await user1Storage.set('wallet:main', { address: 'user1-address' });

            // User 2 stores data with same key
            await user2Storage.set('wallet:main', { address: 'user2-address' });

            // Each user should see only their own data
            const user1Wallet = await user1Storage.get<{ address: string }>('wallet:main');
            const user2Wallet = await user2Storage.get<{ address: string }>('wallet:main');

            expect(user1Wallet?.address).toBe('user1-address');
            expect(user2Wallet?.address).toBe('user2-address');
        });

        it('should not allow user to access another user data via list', async () => {
            await user1Storage.set('wallet:a', 'data');
            await user1Storage.set('wallet:b', 'data');
            await user2Storage.set('wallet:c', 'data');

            const user1Wallets = await user1Storage.list('wallet:');
            const user2Wallets = await user2Storage.list('wallet:');

            // User 1 should only see their wallets
            expect(user1Wallets).toHaveLength(2);
            expect(user1Wallets).toContain('wallet:a');
            expect(user1Wallets).toContain('wallet:b');
            expect(user1Wallets).not.toContain('wallet:c');

            // User 2 should only see their wallets
            expect(user2Wallets).toHaveLength(1);
            expect(user2Wallets).toContain('wallet:c');
        });

        it('should delete only user own data', async () => {
            await user1Storage.set('wallet:main', 'data1');
            await user2Storage.set('wallet:main', 'data2');

            // User 1 deletes their wallet
            await user1Storage.delete('wallet:main');

            // User 1's data should be gone
            expect(await user1Storage.get('wallet:main')).toBeNull();

            // User 2's data should still exist
            expect(await user2Storage.get('wallet:main')).toBe('data2');
        });
    });

    describe('Key prefixing', () => {
        it('should prefix keys with user namespace', async () => {
            await user1Storage.set('test', 'value');

            // Check the base storage has the prefixed key
            const allKeys = await baseStorage.list('user:');
            expect(allKeys).toContain('user:user1:test');
        });

        it('should strip prefix when listing keys', async () => {
            await user1Storage.set('wallet:main', 'data');

            const keys = await user1Storage.list('wallet:');
            // Should return 'wallet:main', not 'user:user1:wallet:main'
            expect(keys).toContain('wallet:main');
            expect(keys.every((k) => !k.startsWith('user:'))).toBe(true);
        });
    });
});
