/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { CHAIN } from '@tonconnect/protocol';
import { Address, toNano } from '@ton/core';
import { vi } from 'vitest';

import { mockFn, mocked, useFakeTimers, useRealTimers } from '../../mock.config';
import { TonWalletKit } from './TonWalletKit';
import { KitGlobalOptions } from './KitGlobalOptions';
import type { TonWalletKitOptions } from '../types';
import { createDummyWallet, createMockApiClient } from '../contracts/w5/WalletV5R1.fixture';
import type { InjectedToExtensionBridgeRequest, InjectedToExtensionBridgeRequestPayload } from '../types/jsBridge';
import type { TONTransferRequest, TransactionRequest } from '../api/models';
import { getUnixtime } from '../utils';

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
        KitGlobalOptions.setGetCurrentTime(getUnixtime);
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

        if (receivedWalletAddress) {
            expect(Address.parse(receivedWalletAddress).toString()).toEqual(
                Address.parse(wallet.getAddress()).toString(),
            );
        }

        await kit.close();
    });

    describe('validUntil validation', () => {
        it('should accept transaction with future validUntil', async () => {
            const kit = await createKit();
            const wallet = await kit.addWallet(await createDummyWallet(1n));

            expect(wallet).toBeDefined();

            if (!wallet) {
                throw new Error('Wallet not created');
            }

            // Set current time to 1000ms (1 second)
            vi.setSystemTime(1000);

            // Sync KitGlobalOptions with fake timer
            KitGlobalOptions.setGetCurrentTime(() => Math.floor(Date.now() / 1000));

            kit.onTransactionRequest(() => {
                //
            });

            const request: TransactionRequest = {
                messages: [
                    {
                        address: wallet.getAddress(),
                        amount: toNano('1').toString(),
                    },
                ],
                validUntil: Math.floor((Date.now() + 10000) / 1000), // 10 seconds in future (11 seconds total)
            };

            // Should not throw
            await expect(kit.handleNewTransaction(wallet, request)).resolves.not.toThrow();

            await kit.close();
        });

        it('should reject transaction with past validUntil', async () => {
            const kit = await createKit();
            const wallet = await kit.addWallet(await createDummyWallet(1n));

            expect(wallet).toBeDefined();

            if (!wallet) {
                throw new Error('Wallet not created');
            }

            // Set current time to 10000ms (10 seconds)
            vi.setSystemTime(10000);

            // Sync KitGlobalOptions with fake timer
            KitGlobalOptions.setGetCurrentTime(() => Math.floor(Date.now() / 1000));

            let errorReceived = false;
            let errorMessage = '';

            const errorPromise = new Promise<void>((resolve) => {
                kit.onRequestError((event) => {
                    errorReceived = true;
                    errorMessage = event.error.message || '';
                    resolve();
                });
            });

            kit.onTransactionRequest(() => {
                // Should not be called for invalid transactions
                throw new Error('onTransactionRequest should not be called for invalid transactions');
            });

            const request: TransactionRequest = {
                messages: [
                    {
                        address: wallet.getAddress(),
                        amount: toNano('1').toString(),
                    },
                ],
                validUntil: Math.floor((Date.now() - 5000) / 1000), // 5 seconds in past (5 seconds)
            };

            // handleNewTransaction should not throw, but error callback should be called
            await kit.handleNewTransaction(wallet, request);

            // Wait for error callback with timeout
            await Promise.race([
                errorPromise,
                new Promise((_, reject) => setTimeout(() => reject(new Error('Error callback not called')), 1000)),
            ]);

            expect(errorReceived).toBe(true);
            expect(errorMessage).toBe('Failed to parse transaction request');

            await kit.close();
        });

        it('should accept transaction without validUntil', async () => {
            const kit = await createKit();
            const wallet = await kit.addWallet(await createDummyWallet(1n));

            expect(wallet).toBeDefined();

            if (!wallet) {
                throw new Error('Wallet not created');
            }

            kit.onTransactionRequest((event) => {
                expect(event.walletId).toBe(wallet.getWalletId());
            });

            const request: TransactionRequest = {
                messages: [
                    {
                        address: wallet.getAddress(),
                        amount: toNano('1').toString(),
                    },
                ],
                // No validUntil
            };

            // Should not throw without validUntil
            await expect(kit.handleNewTransaction(wallet, request)).resolves.not.toThrow();

            await kit.close();
        });

        it('should use custom getCurrentTime function when provided', async () => {
            // Set fake time to 5000ms (5 seconds)
            vi.setSystemTime(5000);

            const customTime = Math.floor(Date.now() / 1000) + 1000; // 1000 seconds in future from fake time (1005 seconds)

            // Set custom time provider
            KitGlobalOptions.setGetCurrentTime(() => {
                return customTime;
            });

            const kit = new TonWalletKit({
                networks: { [CHAIN.MAINNET]: {} },
                storage: {
                    get: mockFn().mockResolvedValue(null),
                    set: mockFn().mockResolvedValue(undefined),
                    remove: mockFn().mockResolvedValue(undefined),
                    clear: mockFn().mockResolvedValue(undefined),
                },
            });
            await kit.waitForReady();

            const wallet = await kit.addWallet(await createDummyWallet(1n));

            expect(wallet).toBeDefined();

            if (!wallet) {
                throw new Error('Wallet not created');
            }

            kit.onTransactionRequest((event) => {
                expect(event.walletId).toBe(wallet.getWalletId());
            });

            const request: TransactionRequest = {
                messages: [
                    {
                        address: wallet.getAddress(),
                        amount: toNano('1').toString(),
                    },
                ],
                validUntil: customTime + 500, // 500 seconds after custom time (1505 seconds)
            };

            // Should not throw because validUntil is in the future relative to custom time
            await expect(kit.handleNewTransaction(wallet, request)).resolves.not.toThrow();

            await kit.close();
        });
    });
});
