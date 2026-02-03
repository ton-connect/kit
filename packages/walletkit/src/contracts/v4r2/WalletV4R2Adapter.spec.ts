/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Cell, loadMessage } from '@ton/core';
import type { CommonMessageInfoExternalIn } from '@ton/core/src/types/CommonMessageInfo';
import { describe, it, expect, beforeEach } from 'vitest';

import { clearAllMocks } from '../../../mock.config';
import { WalletV4R2Adapter } from './WalletV4R2Adapter';
import type { ApiClient } from '../../types/toncenter/ApiClient';
import type { FullAccountState } from '../../types';
import { Uint8ArrayToHex, Signer } from '../../utils';
import { Network } from '../../api/models';
import { mockFn } from '../../../mock.config';

function createMockApiClient(): ApiClient {
    return {
        nftItemsByAddress: mockFn().mockResolvedValue({} as never),
        nftItemsByOwner: mockFn().mockResolvedValue({} as never),
        fetchEmulation: mockFn().mockResolvedValue({} as never),
        sendBoc: mockFn().mockResolvedValue('mock-tx-hash'),
        runGetMethod: mockFn().mockResolvedValue({
            exitCode: 0,
            stack: [
                {
                    type: 'int',
                    value: '0',
                },
            ],
        }),
        getAccountState: mockFn().mockResolvedValue({
            status: 'active',
            balance: '1000000000',
            last: {
                lt: '123',
                hash: Uint8ArrayToHex(new Uint8Array(32).fill(1)),
            },
            frozen: null,
            state: { type: 'active', code: 'mock-code', data: 'mock-data' },
            extraCurrencies: [],
            code: 'mock-code',
            data: 'mock-data',
            lastTransaction: null,
        } as unknown as FullAccountState),
        getBalance: mockFn().mockResolvedValue('1000000000'),
        getAccountTransactions: mockFn().mockResolvedValue({} as never),
        getPendingTrace: mockFn().mockResolvedValue({} as never),
        getPendingTransactions: mockFn().mockResolvedValue({} as never),
        getTrace: mockFn().mockResolvedValue({} as never),
        getTransactionsByHash: mockFn().mockResolvedValue({} as never),
        resolveDnsWallet: mockFn().mockResolvedValue(null),
        backResolveDnsWallet: mockFn().mockResolvedValue(null),
        jettonsByAddress: mockFn().mockResolvedValue({} as never),
        jettonsByOwnerAddress: mockFn().mockResolvedValue({
            jettons: [],
            address_book: {},
            pagination: { offset: 0, limit: 50 },
        } as never),
        getEvents: mockFn().mockResolvedValue({} as never),
    };
}

const mnemonic = [
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

describe('WalletV4R2Adapter', () => {
    let tonClient: ApiClient;
    let wallet: WalletV4R2Adapter;

    beforeEach(async () => {
        clearAllMocks();
        tonClient = createMockApiClient();
        const signer = await Signer.fromMnemonic(mnemonic);
        wallet = await WalletV4R2Adapter.create(signer, {
            client: tonClient,
            network: Network.mainnet(),
        });
    });

    it('should create wallet with correct properties', async () => {
        expect(wallet.version).toEqual('v4r2');
        expect(wallet.client).toEqual(tonClient);
        expect(wallet.getPublicKey()).toBeDefined();
        expect(wallet.getAddress()).toBeDefined();
    });

    it('should produce different transfer body when created with domain (signature differs)', async () => {
        const signer = await Signer.fromMnemonic(mnemonic);
        const walletDefault = await WalletV4R2Adapter.create(signer, {
            client: tonClient,
            network: Network.mainnet(),
        });
        const walletWithDomain = await WalletV4R2Adapter.create(signer, {
            client: tonClient,
            network: Network.mainnet(),
            domain: { type: 'l2', globalId: 42 },
        });

        const args = {
            messages: [
                {
                    address: walletDefault.getAddress(),
                    amount: '1000000',
                },
            ],
        };

        const transferDefault = await walletDefault.getSignedSendTransaction(args, { fakeSignature: false });
        const transferWithDomain = await walletWithDomain.getSignedSendTransaction(args, { fakeSignature: false });

        expect(transferDefault).not.toEqual(transferWithDomain);
    });

    it('should use domain when domain is specified', async () => {
        const signer = await Signer.fromMnemonic(mnemonic);
        const walletWithDomain = await WalletV4R2Adapter.create(signer, {
            client: tonClient,
            network: Network.mainnet(),
            domain: { type: 'l2', globalId: 2000 },
        });

        expect(walletWithDomain.walletContract.domain).toEqual({ type: 'l2', globalId: 2000 });
    });

    it('should work without domain (backward compatibility)', async () => {
        const signer = await Signer.fromMnemonic(mnemonic);
        const walletWithoutDomain = await WalletV4R2Adapter.create(signer, {
            client: tonClient,
            network: Network.mainnet(),
        });

        expect(walletWithoutDomain.walletContract.domain).toBeUndefined();
    });

    it('should support empty domain', async () => {
        const signer = await Signer.fromMnemonic(mnemonic);
        const walletWithEmptyDomain = await WalletV4R2Adapter.create(signer, {
            client: tonClient,
            network: Network.mainnet(),
            domain: { type: 'empty' },
        });

        expect(walletWithEmptyDomain.walletContract.domain).toEqual({ type: 'empty' });
    });

    it('should create signed external message', async () => {
        const address = wallet.getAddress();
        const boc = await wallet.getSignedSendTransaction(
            {
                messages: [
                    {
                        address,
                        amount: '1',
                    },
                ],
            },
            { fakeSignature: false },
        );
        const message = loadMessage(Cell.fromBase64(boc).asSlice());
        const dest = (message.info as unknown as CommonMessageInfoExternalIn).dest.toString();
        expect(dest).toBeDefined();
    });
});
