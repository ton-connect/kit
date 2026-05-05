/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiClientTonApi } from './ApiClientTonApi';

const TEST_ADDRESS = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
const HEX_HASH = `0x${'11'.repeat(32)}`;

function makeTransaction(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        hash: HEX_HASH,
        lt: '1',
        account: TEST_ADDRESS,
        utime: 1,
        orig_status: 'active',
        end_status: 'active',
        total_fees: '0',
        out_msgs: [],
        ...overrides,
    };
}

function makeEvent(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        event_id: HEX_HASH,
        timestamp: 1,
        actions: [],
        account: TEST_ADDRESS,
        ...overrides,
    };
}

describe('ApiClientTonApi', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('uses server-side pagination params for account transactions', async () => {
        const client = new ApiClientTonApi();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getJsonSpy = vi.spyOn(client as any, 'getJson').mockResolvedValue({
            transactions: [makeTransaction()],
        });

        const result = await client.getAccountTransactions({
            address: [TEST_ADDRESS],
            limit: 5,
            offset: 17,
        });

        expect(getJsonSpy).toHaveBeenCalledWith(`/v2/blockchain/accounts/${TEST_ADDRESS}/transactions`, {
            limit: 5,
            offset: 17,
            sort_order: 'desc',
        });
        expect(result.transactions).toHaveLength(1);
    });

    it('maps block ref as (workchain, shard, seqno)', async () => {
        const client = new ApiClientTonApi();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.spyOn(client as any, 'getJson').mockResolvedValue({
            transactions: [
                makeTransaction({
                    block: '( -1, 8000000000000000, 321 )',
                }),
            ],
        });

        const result = await client.getAccountTransactions({
            address: [TEST_ADDRESS],
            limit: 10,
            offset: 0,
        });

        expect(result.transactions[0]?.blockRef).toEqual({
            workchain: -1,
            shard: '8000000000000000',
            seqno: 321,
        });
    });

    it('keeps safe fallback for unexpected block format', async () => {
        const client = new ApiClientTonApi();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.spyOn(client as any, 'getJson').mockResolvedValue({
            transactions: [
                makeTransaction({
                    block: 'unexpected-format',
                }),
            ],
        });

        const result = await client.getAccountTransactions({
            address: [TEST_ADDRESS],
            limit: 10,
            offset: 0,
        });

        expect(result.transactions[0]?.blockRef).toEqual({
            workchain: 0,
            shard: 'unexpected-format',
            seqno: 0,
        });
    });

    it('uses server-side pagination params for events and computes hasNext from response cursor', async () => {
        const client = new ApiClientTonApi();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getJsonSpy = vi.spyOn(client as any, 'getJson').mockResolvedValue({
            events: [makeEvent()],
            next_from: 100,
        });

        const result = await client.getEvents({
            account: TEST_ADDRESS,
            limit: 3,
            offset: 12,
        });

        expect(getJsonSpy).toHaveBeenCalledWith(`/v2/accounts/${TEST_ADDRESS}/events`, {
            limit: 3,
            offset: 12,
            sort_order: 'desc',
            i18n: 'en',
        });
        expect(result.events).toHaveLength(1);
        expect(result.hasNext).toBe(true);
        expect(result.limit).toBe(3);
        expect(result.offset).toBe(12);
    });

    it('normalizes non-32-byte hex transaction hashes', async () => {
        const client = new ApiClientTonApi();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.spyOn(client as any, 'getJson').mockResolvedValue({
            transactions: [
                makeTransaction({
                    hash: '9e8b7e6be85ab2',
                }),
            ],
        });

        const result = await client.getAccountTransactions({
            address: [TEST_ADDRESS],
            limit: 10,
            offset: 0,
        });

        expect(result.transactions[0]?.hash).toBe('0x9e8b7e6be85ab2');
        expect(result.transactions[0]?.traceExternalHash).toBe('0x9e8b7e6be85ab2');
    });

    it('fetches TonAPI bulk accounts', async () => {
        const client = new ApiClientTonApi();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const postJsonSpy = vi.spyOn(client as any, 'postJson').mockResolvedValue({
            accounts: [
                {
                    address: TEST_ADDRESS,
                    balance: 1,
                    last_activity: 1,
                    status: 'active',
                    get_methods: [],
                    is_wallet: true,
                },
            ],
        });

        const result = await client.getBulkAccounts([TEST_ADDRESS]);

        expect(postJsonSpy).toHaveBeenCalledWith('/v2/accounts/_bulk', { account_ids: [TEST_ADDRESS] });
        expect(result).toHaveLength(1);
        expect(result[0]?.address).toBe(TEST_ADDRESS);
    });

    it('resolves bodyHash via /transactions first to avoid message 404 noise', async () => {
        const client = new ApiClientTonApi();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getJsonSpy = vi.spyOn(client as any, 'getJson').mockImplementation(async (url: string) => {
            if (url.includes('/v2/blockchain/transactions/')) {
                return makeTransaction();
            }
            throw new Error(`Unexpected URL: ${url}`);
        });

        const response = await client.getTransactionsByHash({ bodyHash: HEX_HASH });

        expect(response.transactions).toHaveLength(1);
        expect(getJsonSpy).toHaveBeenCalledTimes(1);
        expect(getJsonSpy.mock.calls[0]?.[0]).toContain('/v2/blockchain/transactions/');
    });

    it('resolves msgHash via /messages first', async () => {
        const client = new ApiClientTonApi();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getJsonSpy = vi.spyOn(client as any, 'getJson').mockImplementation(async (url: string) => {
            if (url.includes('/v2/blockchain/messages/')) {
                return makeTransaction();
            }
            throw new Error(`Unexpected URL: ${url}`);
        });

        const response = await client.getTransactionsByHash({ msgHash: HEX_HASH });

        expect(response.transactions).toHaveLength(1);
        expect(getJsonSpy).toHaveBeenCalledTimes(1);
        expect(getJsonSpy.mock.calls[0]?.[0]).toContain('/v2/blockchain/messages/');
    });
});
