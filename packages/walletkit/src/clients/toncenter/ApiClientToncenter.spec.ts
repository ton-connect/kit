/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { afterEach, describe, expect, it, vi } from 'vitest';

import { ApiClientToncenter } from './ApiClientToncenter';

const TEST_ADDRESS = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
const BASE64_HASH = 'ERERERERERERERERERERERERERERERERERERERERERE=';

type ClientWithGetJson = ApiClientToncenter & {
    getJson: (url: string, query?: Record<string, unknown>) => Promise<unknown>;
};

describe('ApiClientToncenter', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('fetches bulk accounts with boc and maps full account state fields', async () => {
        const client = new ApiClientToncenter();
        const getJsonSpy = vi.spyOn(client as ClientWithGetJson, 'getJson').mockResolvedValue({
            accounts: [
                {
                    address: TEST_ADDRESS,
                    balance: '123',
                    code: '/w==',
                    data: 'AA==',
                    last_transaction_lt: '456',
                    last_transaction_hash: BASE64_HASH,
                    frozen_hash: BASE64_HASH,
                    status: 'active',
                    extra_currencies: [{ id: 239, amount: '1000' }],
                },
            ],
        });

        const result = await client.getBulkAccounts([TEST_ADDRESS]);

        expect(getJsonSpy).toHaveBeenCalledWith('/api/v3/accountStates', {
            address: [TEST_ADDRESS],
            include_boc: true,
        });
        expect(result).toEqual([
            {
                address: TEST_ADDRESS,
                balance: '123',
                code: '/w==',
                data: 'AA==',
                extraCurrencies: { 239: 1000n },
                frozenHash: `0x${'11'.repeat(32)}`,
                lastTransaction: {
                    lt: '456',
                    hash: `0x${'11'.repeat(32)}`,
                },
                status: 'active',
            },
        ]);
    });
});
