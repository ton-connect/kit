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
type ClientWithGetJson = ApiClientTonApi & {
    getJson: (url: string, query?: Record<string, unknown>) => Promise<unknown>;
};

function makeTransaction(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        hash: HEX_HASH,
        lt: '1',
        account: { address: TEST_ADDRESS },
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
        const getJsonSpy = vi.spyOn(client as ClientWithGetJson, 'getJson').mockResolvedValue({
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
        vi.spyOn(client as ClientWithGetJson, 'getJson').mockResolvedValue({
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
        vi.spyOn(client as ClientWithGetJson, 'getJson').mockResolvedValue({
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
        const getJsonSpy = vi.spyOn(client as ClientWithGetJson, 'getJson').mockResolvedValue({
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

    it('normalizes non-hex transaction hash values when possible', async () => {
        const client = new ApiClientTonApi();
        vi.spyOn(client as ClientWithGetJson, 'getJson').mockResolvedValue({
            transactions: [
                makeTransaction({
                    hash: 'not-a-hash',
                }),
            ],
        });

        const response = await client.getAccountTransactions({
            address: [TEST_ADDRESS],
            limit: 10,
            offset: 0,
        });

        expect(response.transactions).toHaveLength(1);
        expect(response.transactions[0]?.hash).toMatch(/^0x[0-9a-f]+$/);
    });

    it('resolves bodyHash via /transactions first to avoid message 404 noise', async () => {
        const client = new ApiClientTonApi();
        const getJsonSpy = vi.spyOn(client as ClientWithGetJson, 'getJson').mockImplementation(async (url: string) => {
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
        const getJsonSpy = vi.spyOn(client as ClientWithGetJson, 'getJson').mockImplementation(async (url: string) => {
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
