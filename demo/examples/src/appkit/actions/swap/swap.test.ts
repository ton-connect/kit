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

import { swapExample } from './swap-actions';

describe('Swap Actions Examples', () => {
    let appKit: AppKit;
    let consoleSpy: ReturnType<typeof vi.spyOn>;
    let mockGetQuote: ReturnType<typeof vi.fn>;
    let mockBuildSwapTransaction: ReturnType<typeof vi.fn>;
    let mockSendTransaction: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        appKit = new AppKit({
            networks: {
                [Network.mainnet().chainId]: {},
            },
        });

        mockGetQuote = vi.fn();
        mockBuildSwapTransaction = vi.fn();
        mockSendTransaction = vi.fn();

        // Mock SwapManager
        // @ts-expect-error - internal access
        vi.spyOn(appKit.swapManager, 'getQuote').mockImplementation(mockGetQuote);
        // @ts-expect-error - internal access
        vi.spyOn(appKit.swapManager, 'buildSwapTransaction').mockImplementation(mockBuildSwapTransaction);
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    const setupMockWallet = () => {
        const mockWallet = {
            getAddress: () => 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
            getWalletId: () => 'mock-wallet-id',
            getNetwork: () => 'mainnet',
            sendTransaction: mockSendTransaction,
        } as unknown as WalletInterface;

        appKit.walletsManager.setWallets([mockWallet]);
        return mockWallet;
    };

    describe('swapExample', () => {
        it('should complete full swap flow', async () => {
            setupMockWallet();
            const mockQuote = { providerId: 'mock-provider' };
            const mockTxRequest = { messages: [] };
            const mockTxResponse = { hash: 'mock-hash' };

            mockGetQuote.mockResolvedValue(mockQuote);
            mockBuildSwapTransaction.mockResolvedValue(mockTxRequest);
            mockSendTransaction.mockResolvedValue(mockTxResponse);

            await swapExample(appKit);

            expect(mockGetQuote).toHaveBeenCalled();
            expect(mockBuildSwapTransaction).toHaveBeenCalled();
            expect(mockSendTransaction).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('Swap Quote:', mockQuote);
            expect(consoleSpy).toHaveBeenCalledWith('Swap Transaction:', mockTxResponse);
        });
    });
});
