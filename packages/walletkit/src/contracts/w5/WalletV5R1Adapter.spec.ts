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

import { clearAllMocks, mocked } from '../../../mock.config';
import { WalletV5R1Adapter } from './WalletV5R1Adapter';
import type { ApiClient } from '../../types/toncenter/ApiClient';
import type { FullAccountState } from '../../types';
import { HexToBase64, Uint8ArrayToHex, Signer } from '../../utils';
import {
    addressV5r1,
    addressV5r1Test,
    createMockApiClient,
    mnemonic,
    publicKey,
    stateInit,
    walletId,
} from './WalletV5R1.fixture';
import { Network } from '../../api/models';

describe('WalletV5R1Adapter', () => {
    let tonClient: ApiClient;
    let wallet: WalletV5R1Adapter;

    beforeEach(async () => {
        clearAllMocks();
        tonClient = createMockApiClient();
        const signer = await Signer.fromMnemonic(mnemonic);
        wallet = await WalletV5R1Adapter.create(signer, {
            client: tonClient,
            network: Network.mainnet(),
        });
    });

    it('should create wallet with correct properties', async () => {
        expect(wallet.publicKey).toEqual(Uint8ArrayToHex(publicKey));
        expect(wallet.version).toEqual('v5r1');
        expect(wallet.getAddress()).toEqual(addressV5r1.bounceableNot);
        expect(wallet.getAddress({ testnet: true })).toEqual(addressV5r1Test.bounceableNot);
        expect(await wallet.getStateInit()).toEqual(stateInit);
        expect(await wallet.getWalletV5R1Id()).toEqual(walletId);
        expect(wallet.client).toEqual(tonClient);
        const contract = wallet.walletContract;
        expect(contract.address.toString()).toEqual(addressV5r1.bounceable);
        expect(await contract.walletId).toEqual(walletId);
    });

    it('should sign data using provided signer', async () => {
        const testData = new Uint8Array([1, 2, 3, 4]);
        const signature = HexToBase64(await wallet.sign(testData));
        expect(signature).toEqual(
            'gaYAMdlcwx1KGzqAkUn8jUNeVqNfW8zex2xJK/mlRkDD78K/4U2EvwfrD/q94YVFEnPnpWkPhNhhmGsabQbzBw==',
        );
    });

    it('should throw error if wallet contract not initialized', async () => {
        const signer = await Signer.fromMnemonic(mnemonic);
        const walletWithoutInit = await WalletV5R1Adapter.create(signer, {
            client: tonClient,
            network: Network.mainnet(),
        });
        Object.defineProperty(walletWithoutInit, 'walletContract', {
            value: { ...walletWithoutInit.walletContract, init: undefined },
            writable: true,
        });
        await expect(walletWithoutInit.getStateInit()).rejects.toThrow('Wallet contract not properly initialized');
    });

    it('should return sequence number', async () => {
        const mockSeqno = Promise.resolve(5);
        Object.defineProperty(wallet.walletContract, 'seqno', {
            value: mockSeqno,
            writable: true,
        });
        const seqno = await wallet.getSeqno();
        expect(seqno).toEqual(5);
    });

    it('should handle seqno retrieval errors', async () => {
        const error = new Error('Seqno fetch failed');
        const mockSeqno = Promise.reject(error);
        Object.defineProperty(wallet.walletContract, 'seqno', {
            value: mockSeqno,
            writable: true,
        });
        await expect(wallet.getSeqno()).rejects.toThrow('Seqno fetch failed');
    });

    it('should fallback to config walletId on error', async () => {
        Object.defineProperty(wallet.walletContract, 'walletId', {
            get: () => {
                throw new Error('WalletId fetch failed');
            },
        });
        const walletId = await wallet.getWalletV5R1Id();
        expect(walletId).toBeDefined();
        expect(walletId.subwalletNumber).toEqual(0);
    });

    it('should handle active/inactive/error states', async () => {
        let isDeployed = await wallet.isDeployed();
        expect(isDeployed).toEqual(true);
        expect(tonClient.getAccountState).toHaveBeenCalledWith(wallet.walletContract.address.toString());
        mocked(tonClient.getAccountState).mockResolvedValueOnce({
            status: 'uninitialized',
            balance: '0',
            last: null,
            frozen: null,
            state: { type: 'uninitialized' },
            extraCurrencies: [],
            code: null,
            data: null,
            lastTransaction: null,
        } as unknown as FullAccountState);
        isDeployed = await wallet.isDeployed();
        expect(isDeployed).toEqual(false);
        mocked(tonClient.getAccountState).mockRejectedValueOnce(new Error('Account state fetch failed'));
        isDeployed = await wallet.isDeployed();
        expect(isDeployed).toEqual(false);
    });

    it('should create signed external message', async () => {
        const boc = await wallet.getSignedSendTransaction(
            {
                messages: [
                    {
                        address: addressV5r1.bounceableNot,
                        amount: '1',
                    },
                ],
            },
            { fakeSignature: false },
        );
        const message = loadMessage(Cell.fromBase64(boc).asSlice());
        const dest = (message.info as unknown as CommonMessageInfoExternalIn).dest.toString();
        expect(dest).toEqual(addressV5r1.bounceable);
    });

    it('should produce different transfer body when created with domain (signature differs)', async () => {
        const signer = await Signer.fromMnemonic(mnemonic);
        const walletDefault = await WalletV5R1Adapter.create(signer, {
            client: tonClient,
            network: Network.mainnet(),
        });
        const walletWithDomain = await WalletV5R1Adapter.create(signer, {
            client: tonClient,
            network: Network.mainnet(),
            domain: { type: 'l2', globalId: 42 },
        });

        const args = {
            messages: [
                {
                    address: addressV5r1.bounceableNot,
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
        const walletWithDomain = await WalletV5R1Adapter.create(signer, {
            client: tonClient,
            network: Network.mainnet(),
            domain: { type: 'l2', globalId: 2000 },
        });

        expect(walletWithDomain.walletContract.domain).toEqual({ type: 'l2', globalId: 2000 });
    });

    it('should work without domain (backward compatibility)', async () => {
        const signer = await Signer.fromMnemonic(mnemonic);
        const walletWithoutDomain = await WalletV5R1Adapter.create(signer, {
            client: tonClient,
            network: Network.mainnet(),
        });

        expect(walletWithoutDomain.walletContract.domain).toBeUndefined();
    });

    it('should support empty domain', async () => {
        const signer = await Signer.fromMnemonic(mnemonic);
        const walletWithEmptyDomain = await WalletV5R1Adapter.create(signer, {
            client: tonClient,
            network: Network.mainnet(),
            domain: { type: 'empty' },
        });

        expect(walletWithEmptyDomain.walletContract.domain).toEqual({ type: 'empty' });
    });
});
