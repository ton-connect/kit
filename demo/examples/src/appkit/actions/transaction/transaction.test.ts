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

import { sendTransactionExample } from './send-transaction';
import { transferTonExample } from './transfer-ton';
import { createTransferTonTransactionExample } from './create-transfer-ton-transaction';

describe('Transaction Actions Examples', () => {
    let appKit: AppKit;
    let consoleSpy: ReturnType<typeof vi.spyOn>;
    let mockSendTransaction: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        appKit = new AppKit({
            networks: {
                [Network.mainnet().chainId]: {},
            },
        });

        mockSendTransaction = vi.fn();
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    const setupMockWallet = () => {
        const mockWallet = {
            getAddress: () => 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
            getWalletId: () => 'mock-wallet-id',
            getNetwork: () => Network.mainnet(),
            sendTransaction: mockSendTransaction,
        } as unknown as WalletInterface;

        appKit.walletsManager.setWallets([mockWallet]);
        return mockWallet;
    };

    describe('sendTransactionExample', () => {
        it('should log transaction result', async () => {
            setupMockWallet();
            mockSendTransaction.mockResolvedValue({ hash: 'mock-hash' });

            await sendTransactionExample(appKit);

            expect(mockSendTransaction).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('Transaction Result:', { hash: 'mock-hash' });
        });
    });

    describe('transferTonExample', () => {
        it('should log transfer result', async () => {
            setupMockWallet();
            mockSendTransaction.mockResolvedValue({ hash: 'mock-transfer-hash' });

            await transferTonExample(appKit);

            expect(mockSendTransaction).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('Transfer Result:', { hash: 'mock-transfer-hash' });
        });
    });

    describe('createTransferTonTransactionExample', () => {
        it('should log transaction request', async () => {
            setupMockWallet();

            await createTransferTonTransactionExample(appKit);

            expect(consoleSpy).toHaveBeenCalled();
            const logCall = consoleSpy.mock.calls.find((call: unknown[]) => call[0] === 'Transaction Request:');
            expect(logCall).toBeDefined();
            expect(logCall[1].messages[0].amount).toBe('100000000');
        });
    });
});
