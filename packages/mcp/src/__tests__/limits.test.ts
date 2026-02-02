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
import { LimitsManager } from '../core/LimitsManager.js';

describe('LimitsManager', () => {
    let storage: InMemoryStorageAdapter;
    let userStorage: UserScopedStorage;

    beforeEach(() => {
        storage = new InMemoryStorageAdapter();
        userStorage = new UserScopedStorage(storage, 'testuser');
    });

    describe('Transaction limits', () => {
        it('should allow transactions within limit', async () => {
            const limitsManager = new LimitsManager({
                maxTransactionTon: 100,
            });

            const result = await limitsManager.checkTransactionLimit(userStorage, 50);
            expect(result.allowed).toBe(true);
        });

        it('should reject transactions exceeding per-transaction limit', async () => {
            const limitsManager = new LimitsManager({
                maxTransactionTon: 100,
            });

            const result = await limitsManager.checkTransactionLimit(userStorage, 150);
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('exceeds maximum');
        });
    });

    describe('Daily limits', () => {
        it('should track daily usage', async () => {
            const limitsManager = new LimitsManager({
                dailyLimitTon: 100,
            });

            // First transaction should be allowed
            const result1 = await limitsManager.checkTransactionLimit(userStorage, 50);
            expect(result1.allowed).toBe(true);

            // Record the transaction
            await limitsManager.recordTransaction(userStorage, 50);

            // Second transaction within limit should be allowed
            const result2 = await limitsManager.checkTransactionLimit(userStorage, 30);
            expect(result2.allowed).toBe(true);

            // Record the transaction
            await limitsManager.recordTransaction(userStorage, 30);

            // Third transaction exceeding daily limit should be rejected
            const result3 = await limitsManager.checkTransactionLimit(userStorage, 30);
            expect(result3.allowed).toBe(false);
            expect(result3.reason).toContain('daily limit');
        });
    });

    describe('Wallet count limits', () => {
        it('should allow wallet creation within limit', async () => {
            const limitsManager = new LimitsManager({
                maxWalletsPerUser: 5,
            });

            const result = await limitsManager.checkWalletCountLimit(3);
            expect(result.allowed).toBe(true);
        });

        it('should reject wallet creation at limit', async () => {
            const limitsManager = new LimitsManager({
                maxWalletsPerUser: 5,
            });

            const result = await limitsManager.checkWalletCountLimit(5);
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain('Maximum wallet limit');
        });
    });

    describe('Default limits', () => {
        it('should allow unlimited transactions when no limits set', async () => {
            const limitsManager = new LimitsManager();

            const result = await limitsManager.checkTransactionLimit(userStorage, 1000000);
            expect(result.allowed).toBe(true);
        });

        it('should allow unlimited wallets when no limit set', async () => {
            const limitsManager = new LimitsManager();

            const result = await limitsManager.checkWalletCountLimit(1000);
            expect(result.allowed).toBe(true);
        });
    });
});
