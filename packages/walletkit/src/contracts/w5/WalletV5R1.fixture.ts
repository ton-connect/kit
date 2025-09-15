import { mockFn } from '../../../mock.config';
import type { ApiClient } from '../../types/toncenter/ApiClient';
import type { FullAccountState, GetResult } from '../../types/toncenter/api';
import type { ToncenterEmulationResponse, WalletInitInterface } from '../../types';
import type { NftItemsResponse } from '../../types/toncenter/NftItemsResponse';
import { WalletId } from './WalletV5R1';
import { createWalletV5R1 } from './WalletV5R1Adapter';
import { createWalletInitConfigMnemonic } from '../../types';

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
export const walletId: WalletId = {
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
export function createMockApiClient(): ApiClient {
    return {
        nftItemsByAddress: mockFn().mockResolvedValue({} as NftItemsResponse),
        nftItemsByOwner: mockFn().mockResolvedValue({} as NftItemsResponse),
        fetchEmulation: mockFn().mockResolvedValue({} as ToncenterEmulationResponse),
        sendBoc: mockFn().mockResolvedValue('mock-tx-hash'),
        runGetMethod: mockFn().mockResolvedValue({} as GetResult),
        getAccountState: mockFn().mockResolvedValue({
            status: 'active',
            balance: BigInt(1000000000),
            last: { lt: '123', hash: 'abc' },
            frozen: null,
            state: { type: 'active', code: 'mock-code', data: 'mock-data' },
            extraCurrencies: [],
            code: 'mock-code',
            data: 'mock-data',
            lastTransaction: null,
        } as unknown as FullAccountState),
        getBalance: mockFn().mockResolvedValue(BigInt(1000000000)),
    };
}
export async function createDummyWallet(walletId?: bigint): Promise<WalletInitInterface> {
    return createWalletV5R1(
        createWalletInitConfigMnemonic({
            mnemonic,
            walletId,
        }),
        { tonClient: createMockApiClient() },
    );
}
