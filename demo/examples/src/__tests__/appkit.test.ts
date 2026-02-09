/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getConnectedWallets, AppKit } from '@ton/appkit';

// Mock modules before imports
vi.mock('@ton/appkit', () => import('../__mocks__/@ton/appkit'));
vi.mock('@tonconnect/sdk', () => import('../__mocks__/@tonconnect/sdk'));
vi.mock('@tonconnect/ui-react', () => import('../__mocks__/@tonconnect/ui-react'));
vi.mock('@ton/walletkit', () => import('../__mocks__/@ton/walletkit'));

describe('appkit examples', () => {
    let mockAppKit: AppKit;

    beforeEach(() => {
        vi.clearAllMocks();
        mockAppKit = new AppKit({});
    });

    describe('initialize', () => {
        it('should create AppKit and get connected wallets', async () => {
            const { appKit } = await import('../appkit/initialize');
            expect(appKit).toBeDefined();

            const wallets = getConnectedWallets(appKit);
            expect(wallets).toBeDefined();
            expect(Array.isArray(wallets)).toBe(true);
        });
    });

    describe('send-ton', () => {
        it('should send TON transaction using appkit action', async () => {
            const { sendTon } = await import('../appkit/send-ton');

            // The function now takes AppKit instead of wallet
            await expect(sendTon(mockAppKit)).resolves.not.toThrow();
        });
    });

    describe('send-jettons', () => {
        it('should send Jetton transaction using appkit action', async () => {
            const { sendJettons } = await import('../appkit/send-jettons');

            await expect(sendJettons(mockAppKit)).resolves.not.toThrow();
        });
    });

    describe('send-nft', () => {
        it('should send NFT transaction using appkit', async () => {
            const { sendNft } = await import('../appkit/send-nft');

            await expect(sendNft(mockAppKit)).resolves.not.toThrow();
        });
    });

    describe('fetch-assets', () => {
        it('should fetch jettons using appkit action', async () => {
            const { fetchJettons } = await import('../appkit/fetch-assets');

            const jettons = await fetchJettons(mockAppKit);

            expect(jettons).toHaveLength(1);
            const firstJetton = jettons[0];
            if (firstJetton) {
                expect(firstJetton.info.name).toBe('Test Jetton');
            }
        });
    });
});
