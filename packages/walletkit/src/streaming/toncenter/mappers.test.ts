/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Tests for Toncenter streaming mappers.
 */

import { describe, it, expect } from 'vitest';

import type {
    StreamingV2AccountStateNotification,
    StreamingV2TransactionsNotification,
    StreamingV2JettonsNotification,
} from './types';
import { mapBalance } from './mappers/map-balance';
import { mapTransactions } from './mappers/map-transactions';
import { mapJettons } from './mappers/map-jettons';

describe('Toncenter Mappers', () => {
    const ADDR = '0:83dfd552e63729b472fcbcc8c44e6cc6691702558b68ecb527e1ba403a0f31a8';
    const HASH = 'HCSgz9CwJYQJXdDbo03QVft6KJ7RtG5js9Br8qPDCJ4=';

    describe('mapBalance', () => {
        it('should map balance notification correctly', () => {
            const notification = {
                type: 'account_state_change' as const,
                account: ADDR,
                state: {
                    hash: HASH,
                    balance: '123000',
                    account_status: 'active',
                    data_hash: HASH,
                    code_hash: HASH,
                    last_transaction_id: { lt: '1', hash: HASH },
                },
                finality: 'confirmed' as const,
                timestamp: 123456,
            };
            const result = mapBalance(notification as unknown as StreamingV2AccountStateNotification);
            expect(result.type).toBe('balance');
            expect(result.rawBalance).toBe('123000');
            expect(result.balance).toBe('0.000123');
            expect(result.status).toBe('confirmed');
            expect(result.address).toBe('EQCD39VS5jcptHL8vMjETmzGaRcCVYto7LUn4bpAOg8xqCPE');
        });

        it('should handle malformed address', () => {
            const notification = {
                type: 'account_state_change' as const,
                account: 'invalid',
                state: { balance: '0' },
                finality: 'confirmed' as const,
            };
            // asAddressFriendly might throw or return something for invalid, let's see current behavior
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            expect(() => mapBalance(notification as any)).toThrow();
        });
    });

    describe('mapTransactions', () => {
        const state = {
            hash: HASH,
            balance: '100',
            account_status: 'active',
            data_hash: HASH,
            code_hash: HASH,
            last_transaction_id: { lt: '1', hash: HASH },
        };

        it('should map transactions notification correctly and filter by account', () => {
            const notification = {
                type: 'transactions' as const,
                trace_external_hash_norm: HASH,
                transactions: [
                    {
                        account: ADDR,
                        hash: HASH,
                        lt: '100',
                        now: 1234,
                        mc_block_seqno: 1,
                        trace_id: HASH,
                        prev_trans_hash: HASH,
                        prev_trans_lt: '90',
                        orig_status: 'active',
                        end_status: 'active',
                        total_fees: '100',
                        description: { compute_ph: { success: true } },
                        in_msg: null,
                        out_msgs: [],
                        account_state_before: state,
                        account_state_after: state,
                    },
                    {
                        account: '0:another',
                        hash: HASH,
                        lt: '101',
                    },
                ],
                finality: 'confirmed' as const,
                timestamp: 1234,
            };
            const result = mapTransactions(ADDR, notification as unknown as StreamingV2TransactionsNotification);
            expect(result.type).toBe('transactions');
            // Should only have 1 transaction for ADDR
            expect(result.transactions.length).toBe(1);
            expect(result.transactions[0].hash).toBe(
                '0x1c24a0cfd0b02584095dd0dba34dd055fb7a289ed1b46e63b3d06bf2a3c3089e',
            );
        });

        it('should handle empty transactions', () => {
            const notification = {
                type: 'transactions' as const,
                trace_external_hash_norm: HASH,
                transactions: [],
                finality: 'confirmed' as const,
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = mapTransactions(ADDR, notification as any);
            expect(result.transactions).toEqual([]);
        });

        it('should map optional addressBook and metadata', () => {
            const notification = {
                type: 'transactions' as const,
                trace_external_hash_norm: HASH,
                transactions: [],
                address_book: { [ADDR]: { user_friendly: ADDR, domain: null, interfaces: [] } },
                metadata: { some: 'data' },
                finality: 'confirmed' as const,
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = mapTransactions(ADDR, notification as any);
            expect(result.addressBook).toBeDefined();
            expect(result.metadata).toEqual({ some: 'data' });
        });
    });

    describe('mapJettons', () => {
        it('should map jettons notification correctly with metadata', () => {
            const notification = {
                type: 'jettons_change' as const,
                jetton: {
                    address: ADDR,
                    owner: ADDR,
                    jetton: ADDR,
                    balance: '500000000', // 0.5 if decimals=9
                    last_transaction_lt: '1',
                },
                metadata: {
                    [ADDR]: {
                        token_info: [
                            {
                                type: 'jetton_masters',
                                extra: { decimals: '9' },
                            },
                        ],
                    },
                },
                finality: 'confirmed' as const,
                timestamp: 1234,
            };
            const result = mapJettons(notification as unknown as StreamingV2JettonsNotification);
            expect(result.type).toBe('jettons');
            expect(result.ownerAddress).toBe('EQCD39VS5jcptHL8vMjETmzGaRcCVYto7LUn4bpAOg8xqCPE');
            expect(result.rawBalance).toBe('500000000');
            expect(result.decimals).toBe(9);
            expect(result.balance).toBe('0.5');
        });

        it('should handle missing metadata', () => {
            const notification = {
                type: 'jettons_change' as const,
                jetton: {
                    address: ADDR,
                    owner: ADDR,
                    jetton: ADDR,
                    balance: '500',
                },
                finality: 'confirmed' as const,
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = mapJettons(notification as any);
            expect(result.decimals).toBeUndefined();
            expect(result.balance).toBeUndefined();
            expect(result.rawBalance).toBe('500');
        });

        it('should handle malformed decimals', () => {
            const notification = {
                type: 'jettons_change' as const,
                jetton: {
                    address: ADDR,
                    owner: ADDR,
                    jetton: ADDR,
                    balance: '500',
                },
                metadata: {
                    [ADDR]: {
                        token_info: [
                            {
                                type: 'jetton_masters',
                                extra: { decimals: 'not-a-number' },
                            },
                        ],
                    },
                },
                finality: 'confirmed' as const,
            };
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const result = mapJettons(notification as any);
            expect(isNaN(result.decimals as number)).toBe(true);
            expect(result.balance).toBeUndefined();
        });
    });
});
