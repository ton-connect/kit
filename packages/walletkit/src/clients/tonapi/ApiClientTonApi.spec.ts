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
type ClientWithPostJson = ApiClientTonApi & {
    postJson: (url: string, body?: unknown) => Promise<unknown>;
};

function makeRawAccount(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        address: '0:0000000000000000000000000000000000000000000000000000000000000000',
        balance: 1000000000,
        status: 'active',
        code: 'b5ee9c72',
        data: 'b5ee9c72',
        last_transaction_lt: 100,
        last_transaction_hash: '11'.repeat(32),
        ...overrides,
    };
}

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

    describe('getAccountStates', () => {
        it('fetches one account via bulk endpoint and returns it keyed by the input address', async () => {
            const client = new ApiClientTonApi();
            const postJsonSpy = vi.spyOn(client as ClientWithPostJson, 'postJson').mockResolvedValue({
                accounts: [makeRawAccount({ balance: 29651060393 })],
            });

            const result = await client.getAccountStates([TEST_ADDRESS]);

            expect(postJsonSpy).toHaveBeenCalledWith('/v2/blockchain/accounts/_bulk', {
                account_ids: [TEST_ADDRESS],
            });
            expect(Object.keys(result)).toEqual([TEST_ADDRESS]);
            expect(result[TEST_ADDRESS]).toMatchObject({
                address: TEST_ADDRESS,
                status: 'active',
                rawBalance: '29651060393',
                balance: '29.651060393',
            });
        });

        it('throws synchronously when more than 100 addresses are requested', async () => {
            const client = new ApiClientTonApi();
            const postJsonSpy = vi.spyOn(client as ClientWithPostJson, 'postJson');

            const addrs: string[] = [];
            // Generate 101 valid addresses (distinct so dedup doesn't shrink them).
            for (let i = 0; i < 101; i++) {
                const hex = i.toString(16).padStart(64, '0');
                const { Address } = await import('@ton/core');
                addrs.push(Address.parseRaw(`0:${hex}`).toString());
            }

            await expect(client.getAccountStates(addrs)).rejects.toThrow(/maximum is 100/);
            expect(postJsonSpy).not.toHaveBeenCalled();
        });

        it('deduplicates EQ and UQ forms of the same address into a single request and key', async () => {
            const EQ = 'EQAvDfWFG0oYX19jwNDNBBL1rKNT9XfaGP9HyTb5nb2Eml6y';
            const UQ = 'UQAvDfWFG0oYX19jwNDNBBL1rKNT9XfaGP9HyTb5nb2EmgN3';
            const RAW = '0:2f0df5851b4a185f5f63c0d0cd0412f5aca353f577da18ff47c936f99dbd849a';

            const client = new ApiClientTonApi();
            const postJsonSpy = vi.spyOn(client as ClientWithPostJson, 'postJson').mockResolvedValue({
                accounts: [makeRawAccount({ address: RAW })],
            });

            const result = await client.getAccountStates([EQ, UQ]);

            expect(postJsonSpy).toHaveBeenCalledWith('/v2/blockchain/accounts/_bulk', {
                account_ids: [EQ],
            });
            expect(Object.keys(result)).toEqual([EQ]);
        });

        it('throws synchronously on invalid address format without a network call', async () => {
            const client = new ApiClientTonApi();
            const postJsonSpy = vi.spyOn(client as ClientWithPostJson, 'postJson');

            await expect(client.getAccountStates([TEST_ADDRESS, 'not-an-address'])).rejects.toThrow(
                /Can not convert to AddressFriendly/,
            );
            expect(postJsonSpy).not.toHaveBeenCalled();
        });

        it('returns empty map without a network call for empty input', async () => {
            const client = new ApiClientTonApi();
            const postJsonSpy = vi.spyOn(client as ClientWithPostJson, 'postJson');

            const result = await client.getAccountStates([]);

            expect(result).toEqual({});
            expect(postJsonSpy).not.toHaveBeenCalled();
        });

        it('maps tonapi status:nonexist to non-existing AccountState', async () => {
            const ADDR = 'EQAvDfWFG0oYX19jwNDNBBL1rKNT9XfaGP9HyTb5nb2Eml6y';
            const client = new ApiClientTonApi();
            vi.spyOn(client as ClientWithPostJson, 'postJson').mockResolvedValue({
                accounts: [
                    {
                        address: '0:2f0df5851b4a185f5f63c0d0cd0412f5aca353f577da18ff47c936f99dbd849a',
                        balance: 0,
                        status: 'nonexist',
                        last_transaction_lt: 0,
                    },
                ],
            });

            const result = await client.getAccountStates([ADDR]);

            expect(result[ADDR]).toMatchObject({
                address: ADDR,
                status: 'non-existing',
                rawBalance: '0',
                balance: '0',
            });
        });

        it('keys each address correctly even when the API returns them in a different order', async () => {
            const ADDR_A = 'EQAvDfWFG0oYX19jwNDNBBL1rKNT9XfaGP9HyTb5nb2Eml6y';
            const ADDR_B = 'EQBIhPuWmjT7fP-VomuTWseE8JNWv2q7QYfsVQ1IZwnMk8wL';
            const RAW_A = '0:2f0df5851b4a185f5f63c0d0cd0412f5aca353f577da18ff47c936f99dbd849a';
            const RAW_B = '0:4884fb969a34fb7cff95a26b935ac784f09356bf6abb4187ec550d486709cc93';

            const client = new ApiClientTonApi();
            vi.spyOn(client as ClientWithPostJson, 'postJson').mockResolvedValue({
                accounts: [
                    makeRawAccount({ address: RAW_B, balance: 200 }),
                    makeRawAccount({ address: RAW_A, balance: 100 }),
                ],
            });

            const result = await client.getAccountStates([ADDR_A, ADDR_B]);

            expect(result[ADDR_A]?.rawBalance).toBe('100');
            expect(result[ADDR_B]?.rawBalance).toBe('200');
        });
    });
});
