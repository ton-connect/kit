/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, expect, it, vi, afterEach } from 'vitest';
import * as walletkit from '@ton/walletkit';

import { getJettonsByAddress } from './get-jettons-by-address';
import { Network } from '../../types/network';

describe('getJettonsByAddress', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('keeps raw balance when decimalsNumber is missing and formats only known decimals', async () => {
        const getJettonsFromClientSpy = vi.spyOn(walletkit, 'getJettonsFromClient').mockResolvedValue({
            addressBook: {},
            jettons: [
                {
                    address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
                    balance: '123456789',
                    decimalsNumber: null,
                    info: {
                        symbol: 'RAW',
                        name: 'Raw token',
                    },
                },
                {
                    address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
                    balance: '1000000000',
                    decimalsNumber: 9,
                    info: {
                        symbol: 'FMT',
                        name: 'Formatted token',
                    },
                },
                {
                    address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAABM9c',
                    balance: '0',
                    decimalsNumber: 9,
                    info: {
                        symbol: 'ZERO',
                        name: 'Zero token',
                    },
                },
            ],
        } as any);

        const appKit = {
            networkManager: {
                getClient: vi.fn().mockReturnValue({}),
            },
        } as any;

        const result = await getJettonsByAddress(appKit, {
            address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
            network: Network.mainnet(),
        });

        expect(getJettonsFromClientSpy).toHaveBeenCalledTimes(1);
        expect(result.jettons).toHaveLength(2);

        const rawToken = result.jettons.find((jetton) => jetton.info.symbol === 'RAW');
        const formattedToken = result.jettons.find((jetton) => jetton.info.symbol === 'FMT');

        expect(rawToken?.balance).toBe('123456789');
        expect(formattedToken?.balance).toBe(walletkit.formatUnits('1000000000', 9));
    });
});
