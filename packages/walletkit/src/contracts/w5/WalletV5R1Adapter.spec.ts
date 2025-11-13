/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Cell, loadMessage } from '@ton/core';
import { CommonMessageInfoExternalIn } from '@ton/core/src/types/CommonMessageInfo';
import { CHAIN } from '@tonconnect/protocol';
import { describe, it, expect, beforeEach } from 'vitest';

import { clearAllMocks, mocked } from '../../../mock.config';
import { WalletV5R1Adapter } from './WalletV5R1Adapter';
import type { ApiClient } from '../../types/toncenter/ApiClient';
import type { FullAccountState } from '../../types/toncenter/api';
import { HexToBase64, Uint8ArrayToHex } from '../../utils/base64';
import { Signer } from '../../utils/Signer';
import {
    addressV5r1,
    addressV5r1Test,
    createMockApiClient,
    mnemonic,
    publicKey,
    stateInit,
    walletId,
} from './WalletV5R1.fixture';

describe('WalletV5R1Adapter', () => {
    let tonClient: ApiClient;
    let wallet: WalletV5R1Adapter;

    beforeEach(async () => {
        clearAllMocks();
        tonClient = createMockApiClient();
        const signer = await Signer.fromMnemonic(mnemonic);
        wallet = await WalletV5R1Adapter.create(signer, {
            client: tonClient,
            network: CHAIN.MAINNET,
        });
    });

    it('should create wallet with correct properties', async () => {
        expect(wallet.publicKey).toEqual(Uint8ArrayToHex(publicKey));
        expect(wallet.version).toEqual('v5r1');
        expect(wallet.getAddress()).toEqual(addressV5r1.bounceableNot);
        expect(wallet.getAddress({ testnet: true })).toEqual(addressV5r1Test.bounceableNot);
        expect(await wallet.getStateInit()).toEqual(stateInit);
        expect(await wallet.getWalletId()).toEqual(walletId);
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
            network: CHAIN.MAINNET,
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
        const walletId = await wallet.getWalletId();
        expect(walletId).toBeDefined();
        expect(walletId.subwalletNumber).toEqual(0);
    });

    it('should handle active/inactive/error states', async () => {
        let isDeployed = await wallet.isDeployed();
        expect(isDeployed).toEqual(true);
        expect(tonClient.getAccountState).toHaveBeenCalledWith(wallet.walletContract.address);
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
        expect((message.info as CommonMessageInfoExternalIn).dest.toString()).toEqual(addressV5r1.bounceable);
    });
});
