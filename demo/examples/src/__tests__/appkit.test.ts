/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import type { MockWrappedWallet } from '../__mocks__/@ton/appkit';

// Mock modules before imports
vi.mock('@ton/appkit', () => import('../__mocks__/@ton/appkit'));
vi.mock('@tonconnect/sdk', () => import('../__mocks__/@tonconnect/sdk'));
vi.mock('@tonconnect/ui-react', () => import('../__mocks__/@tonconnect/ui-react'));

// Mock walletkit to use our mock types in the example modules
vi.mock('@ton/walletkit', () => import('../__mocks__/@ton/walletkit'));

describe('appkit examples', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('initialize', () => {
        it('should create AppKit and get connected wallets', async () => {
            const { appKit } = await import('../appkit/initialize');

            expect(appKit).toBeDefined();
            expect(appKit.getConnectedWallets).toBeDefined();

            const wallets = await appKit.getConnectedWallets();
            expect(wallets).toBeDefined();
            expect(Array.isArray(wallets)).toBe(true);
        });
    });

    describe('send-ton', () => {
        it('should send TON transaction', async () => {
            const { sendTon } = await import('../appkit/send-ton');
            const { createMockWrappedWallet } = await import('../__mocks__/@ton/appkit');

            const mockWallet: MockWrappedWallet = createMockWrappedWallet();

            await sendTon(mockWallet);

            expect(mockWallet.createTransferTonTransaction).toHaveBeenCalledWith({
                recipientAddress: 'EQC...recipient...',
                transferAmount: '1000000000',
                comment: 'Payment for services',
            });
            expect(mockWallet.sendTransaction).toHaveBeenCalled();
        });
    });

    describe('send-jettons', () => {
        it('should send Jetton transaction', async () => {
            const { sendJettons } = await import('../appkit/send-jettons');
            const { createMockWrappedWallet } = await import('../__mocks__/@ton/appkit');

            const mockWallet: MockWrappedWallet = createMockWrappedWallet();

            await sendJettons(mockWallet);

            expect(mockWallet.createTransferJettonTransaction).toHaveBeenCalledWith({
                recipientAddress: 'EQC...recipient...',
                jettonAddress: 'EQD...jetton-master...',
                transferAmount: '1000000000',
                comment: 'Jetton payment',
            });
            expect(mockWallet.sendTransaction).toHaveBeenCalled();
        });
    });

    describe('send-nft', () => {
        it('should send NFT transaction', async () => {
            const { sendNft } = await import('../appkit/send-nft');
            const { createMockWrappedWallet } = await import('../__mocks__/@ton/appkit');

            const mockWallet: MockWrappedWallet = createMockWrappedWallet();

            await sendNft(mockWallet);

            expect(mockWallet.createTransferNftTransaction).toHaveBeenCalledWith({
                nftAddress: 'EQD...nft-item...',
                recipientAddress: 'EQC...recipient...',
                comment: 'Sending NFT',
            });
            expect(mockWallet.sendTransaction).toHaveBeenCalled();
        });
    });

    describe('fetch-assets', () => {
        it('should fetch jettons', async () => {
            const { fetchJettons } = await import('../appkit/fetch-assets');
            const { createMockWrappedWallet } = await import('../__mocks__/@ton/appkit');

            const mockWallet: MockWrappedWallet = createMockWrappedWallet();

            const jettons = await fetchJettons(mockWallet);

            expect(mockWallet.getJettons).toHaveBeenCalledWith({
                pagination: { offset: 0, limit: 50 },
            });
            expect(jettons).toHaveLength(1);

            const firstJetton = jettons[0];
            if (firstJetton) {
                expect(firstJetton.info.name).toBe('Test Jetton');
            }
        });

        it('should fetch NFTs', async () => {
            const { fetchNfts } = await import('../appkit/fetch-assets');
            const { createMockWrappedWallet } = await import('../__mocks__/@ton/appkit');

            const mockWallet: MockWrappedWallet = createMockWrappedWallet();

            const nfts = await fetchNfts(mockWallet);

            expect(mockWallet.getNfts).toHaveBeenCalledWith({
                pagination: { offset: 0, limit: 50 },
            });
            expect(nfts).toHaveLength(1);

            const firstNft = nfts[0];
            if (firstNft && firstNft.info) {
                expect(firstNft.info.name).toBe('Test NFT');
            }
        });
    });
});
