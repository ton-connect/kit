/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiClientToncenter } from './ApiClientToncenter';

const TEST_ADDRESS = 'EQAvDfWFG0oYX19jwNDNBBL1rKNT9XfaGP9HyTb5nb2Eml6y';
const TEST_RAW = '0:2F0DF5851B4A185F5F63C0D0CD0412F5ACA353F577DA18FF47C936F99DBD849A';

type ClientWithGetJson = ApiClientToncenter & {
    getJson: (url: string, query?: Record<string, unknown>) => Promise<unknown>;
};

function makeBulkAccount(overrides: Record<string, unknown> = {}): Record<string, unknown> {
    return {
        address: TEST_RAW,
        balance: '1000000000',
        status: 'active',
        extra_currencies: {},
        code_boc: 'base64code',
        data_boc: 'base64data',
        last_transaction_hash: 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
        last_transaction_lt: '100',
        ...overrides,
    };
}

describe('ApiClientToncenter', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('getAccountStates', () => {
        it('synthesizes a non-existing entry when toncenter silently drops the address', async () => {
            const client = new ApiClientToncenter();
            vi.spyOn(client as ClientWithGetJson, 'getJson').mockResolvedValue({
                accounts: [makeBulkAccount({ balance: '500' })],
                address_book: {},
                metadata: {},
            });

            const { Address } = await import('@ton/core');
            const fresh = Address.parseRaw(
                '0:dead000000000000000000000000000000000000000000000000000000000000',
            ).toString();

            const result = await client.getAccountStates([TEST_ADDRESS, fresh]);

            expect(Object.keys(result).sort()).toEqual([TEST_ADDRESS, fresh].sort());
            expect(result[TEST_ADDRESS]?.status).toBe('active');
            expect(result[fresh]).toMatchObject({
                address: fresh,
                status: 'non-existing',
                rawBalance: '0',
                balance: '0',
                extraCurrencies: {},
            });
            expect(result[fresh]?.code).toBeUndefined();
            expect(result[fresh]?.data).toBeUndefined();
            expect(result[fresh]?.lastTransaction).toBeUndefined();
        });

        it('keys each address correctly when toncenter returns them in a different order', async () => {
            const ADDR_A = 'EQAvDfWFG0oYX19jwNDNBBL1rKNT9XfaGP9HyTb5nb2Eml6y';
            const ADDR_B = 'EQBIhPuWmjT7fP-VomuTWseE8JNWv2q7QYfsVQ1IZwnMk8wL';
            const RAW_A = '0:2F0DF5851B4A185F5F63C0D0CD0412F5ACA353F577DA18FF47C936F99DBD849A';
            const RAW_B = '0:4884FB969A34FB7CFF95A26B935AC784F09356BF6ABB4187EC550D486709CC93';

            const client = new ApiClientToncenter();
            vi.spyOn(client as ClientWithGetJson, 'getJson').mockResolvedValue({
                accounts: [
                    makeBulkAccount({ address: RAW_B, balance: '222' }),
                    makeBulkAccount({ address: RAW_A, balance: '111' }),
                ],
                address_book: {},
                metadata: {},
            });

            const result = await client.getAccountStates([ADDR_A, ADDR_B]);

            expect(result[ADDR_A]?.rawBalance).toBe('111');
            expect(result[ADDR_B]?.rawBalance).toBe('222');
        });

        it('deduplicates EQ and UQ forms of the same address into a single request and key', async () => {
            const EQ = 'EQAvDfWFG0oYX19jwNDNBBL1rKNT9XfaGP9HyTb5nb2Eml6y';
            const UQ = 'UQAvDfWFG0oYX19jwNDNBBL1rKNT9XfaGP9HyTb5nb2EmgN3';
            const client = new ApiClientToncenter();
            const getJsonSpy = vi.spyOn(client as ClientWithGetJson, 'getJson').mockResolvedValue({
                accounts: [makeBulkAccount()],
                address_book: {},
                metadata: {},
            });

            const result = await client.getAccountStates([EQ, UQ]);

            expect(getJsonSpy).toHaveBeenCalledWith('/api/v3/accountStates', {
                address: [EQ],
                include_boc: true,
            });
            expect(Object.keys(result)).toEqual([EQ]);
        });

        it('returns empty map without a network call for empty input', async () => {
            const client = new ApiClientToncenter();
            const getJsonSpy = vi.spyOn(client as ClientWithGetJson, 'getJson');

            const result = await client.getAccountStates([]);

            expect(result).toEqual({});
            expect(getJsonSpy).not.toHaveBeenCalled();
        });

        it('throws synchronously on invalid address format without a network call', async () => {
            const client = new ApiClientToncenter();
            const getJsonSpy = vi.spyOn(client as ClientWithGetJson, 'getJson');

            await expect(client.getAccountStates([TEST_ADDRESS, 'not-an-address'])).rejects.toThrow(
                /Can not convert to AddressFriendly/,
            );
            expect(getJsonSpy).not.toHaveBeenCalled();
        });

        it('throws synchronously when more than 100 addresses are requested', async () => {
            const client = new ApiClientToncenter();
            const getJsonSpy = vi.spyOn(client as ClientWithGetJson, 'getJson');

            const { Address } = await import('@ton/core');
            const addrs: string[] = [];
            for (let i = 0; i < 101; i++) {
                const hex = i.toString(16).padStart(64, '0');
                addrs.push(Address.parseRaw(`0:${hex}`).toString());
            }

            await expect(client.getAccountStates(addrs)).rejects.toThrow(/maximum is 100/);
            expect(getJsonSpy).not.toHaveBeenCalled();
        });

        it('fetches one account via accountStates endpoint and returns it keyed by the input address', async () => {
            const client = new ApiClientToncenter();
            const getJsonSpy = vi.spyOn(client as ClientWithGetJson, 'getJson').mockResolvedValue({
                accounts: [makeBulkAccount({ balance: '29651060393' })],
                address_book: {},
                metadata: {},
            });

            const result = await client.getAccountStates([TEST_ADDRESS]);

            expect(getJsonSpy).toHaveBeenCalledWith('/api/v3/accountStates', {
                address: [TEST_ADDRESS],
                include_boc: true,
            });
            expect(Object.keys(result)).toEqual([TEST_ADDRESS]);
            expect(result[TEST_ADDRESS]).toMatchObject({
                address: TEST_ADDRESS,
                status: 'active',
                rawBalance: '29651060393',
                balance: '29.651060393',
            });
        });
    });
});
