/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppKit } from '@ton/appkit';
import { Network } from '@ton/walletkit';
import type { WalletInterface } from '@ton/appkit';
import { Address, beginCell } from '@ton/core';

import { createTransferJettonTransactionExample } from './create-transfer-jetton-transaction';
import { getJettonBalanceExample } from './get-jetton-balance';
import { getJettonInfoExample } from './get-jetton-info';
import { getJettonWalletAddressExample } from './get-jetton-wallet-address';
import { getJettonsByAddressExample } from './get-jettons-by-address';
import { getJettonsExample } from './get-jettons';
import { transferJettonExample } from './transfer-jetton';

describe('Jetton Actions Examples (Integration)', () => {
    let appKit: AppKit;
    let mockClient: {
        jettonsByAddress: ReturnType<typeof vi.fn>;
        jettonsByOwnerAddress: ReturnType<typeof vi.fn>;
        runGetMethod: ReturnType<typeof vi.fn>;
    };
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    const JETTON_ADDRESS = 'EQDBE420tTQIkoWcZ9pEOTKY63WVmwyIl3hH6yWl0r_h51Tl';
    // Real Zero Address
    const VALID_ADDRESS = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
    const JETTON_WALLET_ADDRESS = VALID_ADDRESS;

    // Helper to mock address in stack
    const mockAddressStack = (address: string) => {
        const cell = beginCell().storeAddress(Address.parse(address)).endCell();
        return [{ type: 'cell', value: cell.toBoc().toString('base64') }];
    };

    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        // Initialize real AppKit
        appKit = new AppKit({
            networks: {
                [Network.mainnet().chainId]: {},
            },
        });

        // Mock the ApiClient
        mockClient = {
            jettonsByAddress: vi.fn(),
            jettonsByOwnerAddress: vi.fn(),
            runGetMethod: vi.fn(),
        };

        // Default runGetMethod mock to prevent errors in shared actions
        mockClient.runGetMethod.mockImplementation((_addr: string, method: string) => {
            if (method === 'get_wallet_address') {
                return Promise.resolve({
                    exitCode: 0,
                    stack: mockAddressStack(JETTON_WALLET_ADDRESS),
                });
            }
            if (method === 'get_wallet_data') {
                return Promise.resolve({
                    exitCode: 0,
                    stack: [{ type: 'num', value: '100000000' }],
                });
            }
            return Promise.reject(new Error(`Method ${method} not mocked`));
        });

        // Spy on networkManager.getClient to return our mock client
        // @ts-expect-error - exploiting internal access for testing
        vi.spyOn(appKit.networkManager, 'getClient').mockReturnValue(mockClient);
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    describe('getJettonInfoExample', () => {
        it('should get and log jetton info', async () => {
            mockClient.jettonsByAddress.mockResolvedValue({
                jetton_masters: [{ address: JETTON_ADDRESS, jetton: JETTON_ADDRESS }],
                metadata: {
                    [JETTON_ADDRESS]: {
                        token_info: [
                            {
                                valid: true,
                                type: 'jetton_masters',
                                name: 'Test Jetton',
                                symbol: 'TEST',
                                description: 'Test Description',
                                image: 'test-image-url',
                                extra: { decimals: 6, uri: 'test-uri' },
                            },
                        ],
                    },
                },
            });

            await getJettonInfoExample(appKit);

            expect(mockClient.jettonsByAddress).toHaveBeenCalledWith({
                address: JETTON_ADDRESS,
                offset: 0,
                limit: 1,
            });
            expect(consoleSpy).toHaveBeenCalledWith(
                'Jetton Info:',
                expect.objectContaining({
                    name: 'Test Jetton',
                    symbol: 'TEST',
                    decimals: 6,
                }),
            );
        });
    });

    describe('getJettonWalletAddressExample', () => {
        it('should log jetton wallet address when wallet is selected', async () => {
            const mockWallet = {
                getAddress: () => VALID_ADDRESS,
                getWalletId: () => 'mock-wallet-id',
                getNetwork: () => 'mainnet',
            } as unknown as WalletInterface;
            appKit.walletsManager.setWallets([mockWallet]);

            await getJettonWalletAddressExample(appKit);

            expect(mockClient.runGetMethod).toHaveBeenCalledWith(
                JETTON_ADDRESS,
                'get_wallet_address',
                expect.any(Array),
            );
            expect(consoleSpy).toHaveBeenCalledWith(
                'Jetton Wallet Address:',
                Address.parse(JETTON_WALLET_ADDRESS).toString(),
            );
        });

        it('should log message if no wallet selected', async () => {
            appKit.walletsManager.setWallets([]);
            await getJettonWalletAddressExample(appKit);
            expect(consoleSpy).toHaveBeenCalledWith('No wallet selected');
        });
    });

    describe('getJettonBalanceExample', () => {
        it('should log jetton balance when wallet is selected', async () => {
            const mockWallet = {
                getAddress: () => VALID_ADDRESS,
                getWalletId: () => 'mock-wallet-id',
                getNetwork: () => 'mainnet',
            } as unknown as WalletInterface;
            appKit.walletsManager.setWallets([mockWallet]);

            await getJettonBalanceExample(appKit);

            expect(consoleSpy).toHaveBeenCalledWith('Jetton Balance:', '100');
        });
    });

    describe('getJettonsByAddressExample', () => {
        it('should log jettons count and details', async () => {
            const mockWallet = {
                getAddress: () => VALID_ADDRESS,
                getWalletId: () => 'mock-wallet-id',
                getNetwork: () => 'mainnet',
            } as unknown as WalletInterface;
            appKit.walletsManager.setWallets([mockWallet]);

            mockClient.jettonsByOwnerAddress.mockResolvedValue({
                jettons: [
                    {
                        balance: '100000000',
                        decimalsNumber: 6,
                        info: { name: 'Test Jetton' },
                    },
                ],
            });

            await getJettonsByAddressExample(appKit);

            expect(mockClient.jettonsByOwnerAddress).toHaveBeenCalledWith({
                ownerAddress: VALID_ADDRESS,
                offset: undefined,
                limit: undefined,
            });
            expect(consoleSpy).toHaveBeenCalledWith('Jettons by Address:', 1);
            expect(consoleSpy).toHaveBeenCalledWith('- Test Jetton: 100');
        });
    });

    describe('getJettonsExample', () => {
        it('should log jettons count and details when wallet selected', async () => {
            const mockWallet = {
                getAddress: () => VALID_ADDRESS,
                getWalletId: () => 'mock-wallet-id',
                getNetwork: () => 'mainnet',
            } as unknown as WalletInterface;
            appKit.walletsManager.setWallets([mockWallet]);

            mockClient.jettonsByOwnerAddress.mockResolvedValue({
                jettons: [
                    {
                        balance: '500000000',
                        decimalsNumber: 9,
                        info: { name: 'Grams' },
                    },
                ],
            });

            await getJettonsExample(appKit);

            expect(consoleSpy).toHaveBeenCalledWith('Jettons:', 1);
            expect(consoleSpy).toHaveBeenCalledWith('- Grams: 0.5');
        });
    });

    describe('createTransferJettonTransactionExample', () => {
        it('should log transfer transaction', async () => {
            const mockWallet = {
                getAddress: () => VALID_ADDRESS,
                getWalletId: () => 'mock-wallet-id',
                getNetwork: () => 'mainnet',
            } as unknown as WalletInterface;
            appKit.walletsManager.setWallets([mockWallet]);

            await createTransferJettonTransactionExample(appKit);
            expect(consoleSpy).toHaveBeenCalledWith(
                'Transfer Transaction:',
                expect.objectContaining({
                    fromAddress: VALID_ADDRESS,
                    messages: [
                        expect.objectContaining({
                            address: JETTON_WALLET_ADDRESS,
                            amount: '50000000', // DEFAULT_JETTON_GAS_FEE
                        }),
                    ],
                }),
            );
        });
    });

    describe('transferJettonExample', () => {
        it('should call sendTransaction with transfer data', async () => {
            const mockWallet = {
                getAddress: () => VALID_ADDRESS,
                getWalletId: () => 'mock-wallet-id',
                getNetwork: () => 'mainnet',
                sendTransaction: vi.fn().mockResolvedValue({ hash: 'mock-hash' }),
            } as unknown as WalletInterface;
            appKit.walletsManager.setWallets([mockWallet]);

            await transferJettonExample(appKit);

            expect(mockWallet.sendTransaction).toHaveBeenCalledWith(
                expect.objectContaining({
                    fromAddress: VALID_ADDRESS,
                    messages: [
                        expect.objectContaining({
                            address: JETTON_WALLET_ADDRESS,
                            amount: '50000000',
                        }),
                    ],
                }),
            );
            expect(consoleSpy).toHaveBeenCalledWith('Transfer Result:', { hash: 'mock-hash' });
        });
    });
});
