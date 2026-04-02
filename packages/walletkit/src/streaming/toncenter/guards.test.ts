/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect } from 'vitest';

import { isAccountStateNotification } from './guards/account';
import { isJettonsNotification } from './guards/jetton';
import { isTransactionsNotification } from './guards/transaction';

describe('Toncenter Guards', () => {
    describe('isAccountStateNotification', () => {
        it('should return true for valid account state notification', () => {
            const msg = {
                type: 'account_state_change',
                account: 'address',
                state: {
                    balance: '1000',
                },
            };
            expect(isAccountStateNotification(msg)).toBe(true);
        });

        it('should return false for invalid notification', () => {
            const cases = [
                null,
                {},
                { type: 'wrong' },
                { type: 'account_state_change' },
                { type: 'account_state_change', account: 123 },
                { type: 'account_state_change', account: 'addr', state: null },
                { type: 'account_state_change', account: 'addr', state: {} },
                { type: 'account_state_change', account: 'addr', state: { balance: 100 } },
            ];

            for (const c of cases) {
                expect(isAccountStateNotification(c)).toBe(false);
            }
        });
    });

    describe('isJettonsNotification', () => {
        it('should return true for valid jettons notification', () => {
            const msg = {
                type: 'jettons_change',
                jetton: {
                    address: '0:jetton',
                    owner: '0:owner',
                },
                jetton_wallets: [],
            };
            expect(isJettonsNotification(msg)).toBe(true);
        });

        it('should return false for invalid notification', () => {
            const cases = [
                null,
                {},
                { type: 'wrong' },
                { type: 'jettons_change' },
                { type: 'jettons_change', jetton: null },
                { type: 'jettons_change', jetton: {} },
                { type: 'jettons_change', jetton: { address: 'a' } },
                { type: 'jettons_change', jetton: { address: 'a', owner: 1 } },
            ];

            for (const c of cases) {
                expect(isJettonsNotification(c)).toBe(false);
            }
        });
    });

    describe('isTransactionsNotification', () => {
        it('should return true for valid transactions notification', () => {
            const msg = {
                type: 'transactions',
                trace_external_hash_norm: 'HCSgz9CwJYQJXdDbo03QVft6KJ7RtG5js9Br8qPDCJ4=',
                transactions: [],
            };
            expect(isTransactionsNotification(msg)).toBe(true);
        });

        it('should return false for invalid notification', () => {
            const cases = [
                null,
                {},
                { type: 'wrong' },
                { type: 'transactions' },
                { type: 'transactions', trace_external_hash_norm: 123 },
                { type: 'transactions', trace_external_hash_norm: 'h', transactions: {} },
            ];

            for (const c of cases) {
                expect(isTransactionsNotification(c)).toBe(false);
            }
        });
    });
});
