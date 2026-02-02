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
import { PendingTransactionManager } from '../core/PendingTransactionManager.js';
import type { PendingTonTransfer } from '../core/PendingTransactionManager.js';

describe('PendingTransactionManager', () => {
    let storage: InMemoryStorageAdapter;
    let userStorage: UserScopedStorage;
    let pendingManager: PendingTransactionManager;

    beforeEach(() => {
        storage = new InMemoryStorageAdapter();
        userStorage = new UserScopedStorage(storage, 'testuser');
        pendingManager = new PendingTransactionManager(5); // 5 second TTL for tests
    });

    describe('Creating pending transactions', () => {
        it('should create a pending transaction', async () => {
            const pending = await pendingManager.createPending(userStorage, {
                type: 'send_ton',
                walletName: 'main',
                description: 'Send 1 TON to test',
                data: {
                    type: 'send_ton',
                    toAddress: 'EQTest...',
                    amountNano: '1000000000',
                    amountTon: '1',
                } as PendingTonTransfer,
            });

            expect(pending.id).toMatch(/^tx_/);
            expect(pending.type).toBe('send_ton');
            expect(pending.walletName).toBe('main');
            expect(pending.description).toBe('Send 1 TON to test');
        });

        it('should store pending transaction in user storage', async () => {
            const pending = await pendingManager.createPending(userStorage, {
                type: 'send_ton',
                walletName: 'main',
                description: 'Test',
                data: {
                    type: 'send_ton',
                    toAddress: 'EQTest...',
                    amountNano: '1000000000',
                    amountTon: '1',
                } as PendingTonTransfer,
            });

            const retrieved = await pendingManager.getPending(userStorage, pending.id);
            expect(retrieved).not.toBeNull();
            expect(retrieved?.id).toBe(pending.id);
        });
    });

    describe('Listing pending transactions', () => {
        it('should list all pending transactions for user', async () => {
            await pendingManager.createPending(userStorage, {
                type: 'send_ton',
                walletName: 'wallet1',
                description: 'Transaction 1',
                data: {
                    type: 'send_ton',
                    toAddress: 'a',
                    amountNano: '1',
                    amountTon: '0.000000001',
                } as PendingTonTransfer,
            });

            await pendingManager.createPending(userStorage, {
                type: 'send_ton',
                walletName: 'wallet2',
                description: 'Transaction 2',
                data: {
                    type: 'send_ton',
                    toAddress: 'b',
                    amountNano: '2',
                    amountTon: '0.000000002',
                } as PendingTonTransfer,
            });

            const pending = await pendingManager.listPending(userStorage);
            expect(pending).toHaveLength(2);
        });

        it('should isolate pending transactions between users', async () => {
            const user2Storage = new UserScopedStorage(storage, 'user2');

            await pendingManager.createPending(userStorage, {
                type: 'send_ton',
                walletName: 'wallet1',
                description: 'User 1 transaction',
                data: {
                    type: 'send_ton',
                    toAddress: 'a',
                    amountNano: '1',
                    amountTon: '0.000000001',
                } as PendingTonTransfer,
            });

            await pendingManager.createPending(user2Storage, {
                type: 'send_ton',
                walletName: 'wallet2',
                description: 'User 2 transaction',
                data: {
                    type: 'send_ton',
                    toAddress: 'b',
                    amountNano: '2',
                    amountTon: '0.000000002',
                } as PendingTonTransfer,
            });

            const user1Pending = await pendingManager.listPending(userStorage);
            const user2Pending = await pendingManager.listPending(user2Storage);

            expect(user1Pending).toHaveLength(1);
            expect(user1Pending[0]?.description).toBe('User 1 transaction');

            expect(user2Pending).toHaveLength(1);
            expect(user2Pending[0]?.description).toBe('User 2 transaction');
        });
    });

    describe('Confirming transactions', () => {
        it('should confirm and return pending transaction', async () => {
            const pending = await pendingManager.createPending(userStorage, {
                type: 'send_ton',
                walletName: 'main',
                description: 'Test',
                data: {
                    type: 'send_ton',
                    toAddress: 'a',
                    amountNano: '1',
                    amountTon: '0.000000001',
                } as PendingTonTransfer,
            });

            const confirmed = await pendingManager.confirmPending(userStorage, pending.id);
            expect(confirmed).not.toBeNull();
            expect(confirmed?.id).toBe(pending.id);

            // Should be deleted after confirmation
            const afterConfirm = await pendingManager.getPending(userStorage, pending.id);
            expect(afterConfirm).toBeNull();
        });

        it('should return null for non-existent transaction', async () => {
            const result = await pendingManager.confirmPending(userStorage, 'nonexistent');
            expect(result).toBeNull();
        });
    });

    describe('Canceling transactions', () => {
        it('should cancel pending transaction', async () => {
            const pending = await pendingManager.createPending(userStorage, {
                type: 'send_ton',
                walletName: 'main',
                description: 'Test',
                data: {
                    type: 'send_ton',
                    toAddress: 'a',
                    amountNano: '1',
                    amountTon: '0.000000001',
                } as PendingTonTransfer,
            });

            const cancelled = await pendingManager.cancelPending(userStorage, pending.id);
            expect(cancelled).toBe(true);

            // Should be deleted after cancellation
            const afterCancel = await pendingManager.getPending(userStorage, pending.id);
            expect(afterCancel).toBeNull();
        });

        it('should return false for non-existent transaction', async () => {
            const result = await pendingManager.cancelPending(userStorage, 'nonexistent');
            expect(result).toBe(false);
        });
    });

    describe('Transaction expiration', () => {
        it('should expire transactions after TTL', async () => {
            // Use 1 second TTL
            const shortTtlManager = new PendingTransactionManager(1);

            const pending = await shortTtlManager.createPending(userStorage, {
                type: 'send_ton',
                walletName: 'main',
                description: 'Test',
                data: {
                    type: 'send_ton',
                    toAddress: 'a',
                    amountNano: '1',
                    amountTon: '0.000000001',
                } as PendingTonTransfer,
            });

            // Should exist immediately
            const beforeExpire = await shortTtlManager.getPending(userStorage, pending.id);
            expect(beforeExpire).not.toBeNull();

            // Wait for expiration
            await new Promise((resolve) => setTimeout(resolve, 1100));

            // Should be expired
            const afterExpire = await shortTtlManager.getPending(userStorage, pending.id);
            expect(afterExpire).toBeNull();
        });
    });
});
