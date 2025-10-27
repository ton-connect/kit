/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { mockFn, mocked } from '../../../mock.config';
import { createMockApiClient } from '../../contracts/w5/WalletV5R1.fixture';
import { DnsCategory, dnsResolve, toDnsInternal, toTonDnsCategory } from './dnsResolve';

const mockApiClient = createMockApiClient();

mocked('../../core/ApiClientToncenter', () => {
    return {
        ApiClientToncenter: mockFn().mockImplementation(() => mockApiClient),
    };
});

describe('dnsResolve', () => {
    beforeEach(() => {});

    afterEach(() => {});

    it('toTonDnsCategory', async () => {
        expect(toTonDnsCategory()).toEqual(0n);
        expect(toTonDnsCategory(DnsCategory.All)).toEqual(0n);
        expect(toTonDnsCategory(DnsCategory.DnsNextResolver)).toEqual(
            11732114750494247458678882651681748623800183221773167493832867265755123357695n,
        );
        expect(toTonDnsCategory(DnsCategory.Wallet)).toEqual(
            105311596331855300602201538317979276640056460191511695660591596829410056223515n,
        );
        expect(toTonDnsCategory(DnsCategory.Site)).toEqual(
            113837984718866553357015413641085683664993881322709313240352703269157551621118n,
        );
        expect(toTonDnsCategory(DnsCategory.BagId)).toEqual(
            33305727148774590499946634090951755272001978043137765208040544350030765946327n,
        );
        expect(toTonDnsCategory('')).toEqual(
            102987336249554097029535212322581322789799900648198034993379397001115665086549n,
        );
    });

    it('toDnsInternal self', async () => {
        expect(toDnsInternal('')).toEqual('\0');
        expect(toDnsInternal('.')).toEqual('\0');
    });

    it('toDnsInternal', async () => {
        expect(toDnsInternal('ton')).toEqual('ton\0');
        expect(toDnsInternal('wallet.ton')).toEqual('ton\0wallet\0');
        expect(toDnsInternal('some.wallet.ton')).toEqual('ton\0wallet\0some\0');
    });

    it('not exist', async () => {
        const found = await dnsResolve(mockApiClient, 'not-exist.ton');
        expect(found).toEqual(null);
    });
});
