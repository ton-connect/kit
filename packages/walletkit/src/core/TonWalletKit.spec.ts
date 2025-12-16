/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CHAIN } from '@tonconnect/protocol';

import { mockFn, mocked, useFakeTimers, useRealTimers } from '../../mock.config';
import { TonWalletKit } from './TonWalletKit';
import type { TonWalletKitOptions } from '../types';
import { createDummyWallet, createMockApiClient } from '../contracts/w5/WalletV5R1.fixture';
import type { InjectedToExtensionBridgeRequest, InjectedToExtensionBridgeRequestPayload } from '../types/jsBridge';
import type { TONTransferRequest } from '../api/models';

const mockApiClient = createMockApiClient();

mocked('./ApiClientToncenter', () => {
    return {
        ApiClientToncenter: mockFn().mockImplementation(() => mockApiClient),
    };
});

describe('TonWalletKit', () => {
    beforeEach(() => {
        useFakeTimers();
    });

    afterEach(() => {
        useRealTimers();
    });

    const createKit = async () => {
        const options: TonWalletKitOptions = {
            // Use networks config (required) - MAINNET to match the dummy wallet fixture
            networks: {
                [CHAIN.MAINNET]: {},
            },
            bridge: {
                enableJsBridge: false,
                // bridgeName: 'test',
            },
            eventProcessor: {
                disableEvents: true,
            },
            // Ensure we have storage in node env
            storage: {
                get: mockFn().mockResolvedValue(null),
                set: mockFn().mockResolvedValue(undefined),
                remove: mockFn().mockResolvedValue(undefined),
                clear: mockFn().mockResolvedValue(undefined),
            },
        };
        const kit = new TonWalletKit(options);
        await kit.waitForReady();
        return kit;
    };

    it('kit is ready and close', async () => {
        const kit = await createKit();
        expect(kit.isReady()).toBe(true);
        expect(kit.getStatus()).toEqual({ initialized: true, ready: true });
        await kit.close();
        expect(kit.isReady()).toBe(false);
        expect(kit.getStatus()).toEqual({ initialized: false, ready: false });
    });

    it('clearWallets removes all wallets', async () => {
        const kit = await createKit();
        await kit.addWallet(await createDummyWallet(1n));
        await kit.addWallet(await createDummyWallet(2n));
        // expect(kit.getWallets().length).toBe(2); // FIXME

        await kit.clearWallets();
        expect(kit.getWallets().length).toBe(0);
        await kit.close();
    });

    it('handleTonConnectUrl rejects invalid urls', async () => {
        const kit = await createKit();
        await expect(kit.handleTonConnectUrl('https://example.com')).rejects.toThrow();
        await kit.close();
    });

    it('processInjectedBridgeRequest returns void/undefined', async () => {
        const kit = await createKit();

        const result = await kit.processInjectedBridgeRequest(
            { method: 'noop' } as unknown as InjectedToExtensionBridgeRequest,
            undefined as unknown as InjectedToExtensionBridgeRequestPayload,
        );
        expect(result).toBeUndefined();
        await kit.close();
    });

    it('handleNewTransaction triggers onTransactionRequest callback with walletId', async () => {
        const kit = await createKit();
        const wallet = await kit.addWallet(await createDummyWallet(1n));

        expect(wallet).toBeDefined();

        if (!wallet) {
            throw new Error('Wallet not created');
        }

        let receivedWalletId: string | undefined;
        let receivedWalletAddress: string | undefined;

        kit.onTransactionRequest((event) => {
            receivedWalletId = event.walletId;
            receivedWalletAddress = event.walletAddress;
        });

        const tonTransferParams: TONTransferRequest = {
            recipientAddress: wallet.getAddress(),
            transferAmount: '1000000000',
        };
        const result = await wallet.createTransferTonTransaction(tonTransferParams);

        await kit.handleNewTransaction(wallet, result);

        expect(receivedWalletId).toBe(wallet.getWalletId());
        expect(receivedWalletAddress).toBe(wallet.getAddress().toString());

        await kit.close();
    });
});
