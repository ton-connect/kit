/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Dictionary } from '@ton/core';

import { mockFn } from '../../../mock.config';
import type { ApiClient, GetEventsResponse } from '../../types/toncenter/ApiClient';
import type { FullAccountState } from '../../types/toncenter/api';
import type { ToncenterEmulationResponse, ToncenterTracesResponse } from '../../types';
import type { ResponseUserJettons } from '../../types/export/responses/jettons';
import type { NftItemsResponse } from '../../types/toncenter/NftItemsResponse';
import type { WalletV5R1Id } from './WalletV5R1';
import { walletV5ConfigToCell } from './WalletV5R1';
import { WalletV5R1Adapter } from './WalletV5R1Adapter';
import type { ToncenterResponseJettonMasters, ToncenterTransactionsResponse } from '../../types/toncenter/emulation';
import { Signer } from '../../utils/Signer';
import { Network } from '../../api/models';

export const mnemonic = [
    'hospital',
    'stove',
    'relief',
    'fringe',
    'tongue',
    'always',
    'charge',
    'angry',
    'urge',
    'sentence',
    'again',
    'match',
    'nerve',
    'inquiry',
    'senior',
    'coconut',
    'label',
    'tumble',
    'carry',
    'category',
    'beauty',
    'bean',
    'road',
    'solution',
];
export const publicKey = new Uint8Array([
    246, 196, 80, 161, 107, 177, 197, 20, 226, 47, 25, 119, 227, 144, 163, 2, 85, 153, 170, 30, 123, 0, 6, 138, 106,
    172, 242, 17, 148, 132, 193, 189,
]);
export const walletId: WalletV5R1Id = {
    serialized: 2147483409n,
    subwalletNumber: 2147483409,
};
export const stateInit =
    'te6cckECFgEAArEAAgE0ARUBFP8A9KQT9LzyyAsCAgEgAw4CAUgEBQLc0CDXScEgkVuPYyDXCx8gghBleHRuvSGCEHNpbnS9sJJfA+CCEGV4dG66jrSAINchAdB01yH6QDD6RPgo+kQwWL2RW+DtRNCBAUHXIfQFgwf0Dm+hMZEw4YBA1yFwf9s84DEg10mBAoC5kTDgcOIREAIBIAYNAgEgBwoCAW4ICQAZrc52omhAIOuQ64X/wAAZrx32omhAEOuQ64WPwAIBSAsMABezJftRNBx1yHXCx+AAEbJi+1E0NcKAIAAZvl8PaiaECAoOuQ+gLAEC8g8BHiDXCx+CEHNpZ2668uCKfxAB5o7w7aLt+yGDCNciAoMI1yMggCDXIdMf0x/TH+1E0NIA0x8g0x/T/9cKAAr5AUDM+RCaKJRfCtsx4fLAh98Cs1AHsPLQhFEluvLghVA2uvLghvgju/LQiCKS+ADeAaR/yMoAyx8BzxbJ7VQgkvgP3nDbPNgRA/btou37AvQEIW6SbCGOTAIh1zkwcJQhxwCzji0B1yggdh5DbCDXScAI8uCTINdKwALy4JMg1x0GxxLCAFIwsPLQiddM1zkwAaTobBKEB7vy4JPXSsAA8uCT7VXi0gABwACRW+Dr1ywIFCCRcJYB1ywIHBLiUhCx4w8g10oSExQAlgH6QAH6RPgo+kQwWLry4JHtRNCBAUHXGPQFBJ1/yMoAQASDB/RT8uCLjhQDgwf0W/LgjCLXCgAhbgGzsPLQkOLIUAPPFhL0AMntVAByMNcsCCSOLSHy4JLSAO1E0NIAURO68tCPVFAwkTGcAYEBQNch1woA8uCO4sjKAFjPFsntVJPywI3iABCTW9sx4ddM0ABRgAAAAD///4j7YihQtdjiinEXjLvxyFGBKszVDz2AA0U1VnkIykJg3qCxZgt/';
export const addressV5r1 = {
    bounceable: 'EQDSLOFVamNZzdy4LulclcCBEFkRReZ7WscBCLAw3Pg53kAk',
    bounceableNot: 'UQDSLOFVamNZzdy4LulclcCBEFkRReZ7WscBCLAw3Pg53h3h',
};
export const addressV5r1Test = {
    bounceableNot: '0QDSLOFVamNZzdy4LulclcCBEFkRReZ7WscBCLAw3Pg53qZr',
};

const walletDataCell = walletV5ConfigToCell({
    signatureAllowed: true,
    seqno: 5,
    walletId: 2147483409,
    publicKey: BigInt('0x' + Buffer.from(publicKey).toString('hex')),
    extensions: Dictionary.empty(),
});
const walletDataBase64 = walletDataCell.toBoc().toString('base64');

export function createMockApiClient(): ApiClient {
    return {
        nftItemsByAddress: mockFn().mockResolvedValue({} as NftItemsResponse),
        nftItemsByOwner: mockFn().mockResolvedValue({} as NftItemsResponse),
        fetchEmulation: mockFn().mockResolvedValue({} as ToncenterEmulationResponse),
        sendBoc: mockFn().mockResolvedValue('mock-tx-hash'),
        runGetMethod: mockFn().mockResolvedValue({}),
        getAccountState: mockFn().mockResolvedValue({
            status: 'active',
            balance: '1000000000',
            extraCurrencies: {},
            code: 'mock-code',
            data: walletDataBase64,
            lastTransaction: null,
        } as unknown as FullAccountState),
        getBalance: mockFn().mockResolvedValue('1000000000'),
        getAccountTransactions: mockFn().mockResolvedValue({} as ToncenterTransactionsResponse),
        getPendingTrace: mockFn().mockResolvedValue({} as ToncenterTracesResponse),
        getPendingTransactions: mockFn().mockResolvedValue({} as ToncenterTransactionsResponse),
        getTrace: mockFn().mockResolvedValue({} as ToncenterTracesResponse),
        getTransactionsByHash: mockFn().mockResolvedValue({} as ToncenterTransactionsResponse),
        resolveDnsWallet: mockFn().mockResolvedValue({} as string | null),
        backResolveDnsWallet: mockFn().mockResolvedValue({} as string | null),
        jettonsByAddress: mockFn().mockResolvedValue({} as ToncenterResponseJettonMasters),
        jettonsByOwnerAddress: mockFn().mockResolvedValue({
            jettons: [],
            address_book: {},
            pagination: { offset: 0, limit: 50 },
        } as ResponseUserJettons),
        getEvents: mockFn().mockResolvedValue({} as GetEventsResponse),
    };
}
export async function createDummyWallet(walletId?: bigint): Promise<WalletV5R1Adapter> {
    const signer = await Signer.fromMnemonic(mnemonic);
    return WalletV5R1Adapter.create(signer, {
        client: createMockApiClient(),
        network: Network.mainnet(),
        walletId,
    });
}
