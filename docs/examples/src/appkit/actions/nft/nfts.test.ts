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

import { createTransferNftTransactionExample } from './create-transfer-nft-transaction';
import { getNftExample } from './get-nft';
import { getNftsByAddressExample } from './get-nfts-by-address';
import { getNftsExample } from './get-nfts';
import { transferNftExample } from './transfer-nft';

describe('NFT Actions Examples (Integration)', () => {
    let appKit: AppKit;
    let mockClient: {
        nftItemsByAddress: ReturnType<typeof vi.fn>;
        nftItemsByOwner: ReturnType<typeof vi.fn>;
        runGetMethod: ReturnType<typeof vi.fn>;
    };
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    // Use zero address which is guaranteed to be valid
    const VALID_ADDRESS = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';
    const NFT_ADDRESS = VALID_ADDRESS;
    const OWNER_ADDRESS = VALID_ADDRESS;

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
            nftItemsByAddress: vi.fn(),
            nftItemsByOwner: vi.fn(),
            runGetMethod: vi.fn(),
        };

        // Spy on networkManager.getClient to return our mock client
        // @ts-expect-error - exploiting internal access for testing
        vi.spyOn(appKit.networkManager, 'getClient').mockReturnValue(mockClient);
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    describe('getNftExample', () => {
        it('should get and log NFT info', async () => {
            mockClient.nftItemsByAddress.mockResolvedValue({
                nfts: [
                    {
                        address: NFT_ADDRESS,
                        info: { name: 'Test NFT' },
                        collection: { name: 'Test Collection' },
                    },
                ],
            });

            await getNftExample(appKit);

            expect(mockClient.nftItemsByAddress).toHaveBeenCalledWith({
                address: NFT_ADDRESS,
            });
            expect(consoleSpy).toHaveBeenCalledWith('NFT Name:', 'Test NFT');
            expect(consoleSpy).toHaveBeenCalledWith('NFT Collection:', 'Test Collection');
        });
    });

    describe('getNftsByAddressExample', () => {
        it('should log count of NFTs by address', async () => {
            mockClient.nftItemsByOwner.mockResolvedValue({
                nfts: [
                    { address: NFT_ADDRESS, info: { name: 'NFT 1' } },
                    {
                        address: 'EQBvW8Z9l8-z_oP_x2J4Cj9v9-y_X--8_e_v_y_f_v_8_e_'.slice(0, 48),
                        info: { name: 'NFT 2' },
                    },
                ],
            });

            await getNftsByAddressExample(appKit);

            expect(mockClient.nftItemsByOwner).toHaveBeenCalledWith({
                ownerAddress: OWNER_ADDRESS,
                pagination: {
                    limit: undefined,
                    offset: undefined,
                },
            });
            expect(consoleSpy).toHaveBeenCalledWith('NFTs by address:', 2);
        });
    });

    describe('getNftsExample', () => {
        it('should log count and names of NFTs for selected wallet', async () => {
            const mockWallet = {
                getAddress: () => OWNER_ADDRESS,
                getWalletId: () => 'mock-wallet-id',
                getNetwork: () => 'mainnet',
            } as unknown as WalletInterface;
            appKit.walletsManager.setWallets([mockWallet]);

            mockClient.nftItemsByOwner.mockResolvedValue({
                nfts: [{ address: NFT_ADDRESS, info: { name: 'Cool NFT' } }],
            });

            await getNftsExample(appKit);

            expect(consoleSpy).toHaveBeenCalledWith('Total NFTs:', 1);
            expect(consoleSpy).toHaveBeenCalledWith('- Cool NFT');
        });
    });

    describe('createTransferNftTransactionExample', () => {
        it('should log NFT transfer transaction', async () => {
            const mockWallet = {
                getAddress: () => OWNER_ADDRESS,
                getWalletId: () => 'mock-wallet-id',
                getNetwork: () => 'mainnet',
            } as unknown as WalletInterface;
            appKit.walletsManager.setWallets([mockWallet]);

            await createTransferNftTransactionExample(appKit);

            expect(consoleSpy).toHaveBeenCalledWith(
                'NFT Transfer Transaction:',
                expect.objectContaining({
                    fromAddress: OWNER_ADDRESS,
                    messages: [
                        expect.objectContaining({
                            address: NFT_ADDRESS,
                            amount: '100000000', // DEFAULT_NFT_GAS_FEE
                        }),
                    ],
                }),
            );
        });
    });

    describe('transferNftExample', () => {
        it('should call sendTransaction and log result', async () => {
            const mockWallet = {
                getAddress: () => OWNER_ADDRESS,
                getWalletId: () => 'mock-wallet-id',
                getNetwork: () => 'mainnet',
                sendTransaction: vi.fn().mockResolvedValue({ hash: 'nft-mock-hash' }),
            } as unknown as WalletInterface;
            appKit.walletsManager.setWallets([mockWallet]);

            await transferNftExample(appKit);

            expect(mockWallet.sendTransaction).toHaveBeenCalledWith(
                expect.objectContaining({
                    fromAddress: OWNER_ADDRESS,
                    messages: [
                        expect.objectContaining({
                            address: NFT_ADDRESS,
                        }),
                    ],
                }),
            );
            expect(consoleSpy).toHaveBeenCalledWith('NFT Transfer Result:', { hash: 'nft-mock-hash' });
        });
    });
});
