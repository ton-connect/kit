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

import { signTextExample } from './sign-text';
import { signBinaryExample } from './sign-binary';
import { signCellExample } from './sign-cell';

describe('Signing Actions Examples', () => {
    let appKit: AppKit;
    let consoleSpy: ReturnType<typeof vi.spyOn>;
    let mockSignData: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        appKit = new AppKit({
            networks: {
                [Network.mainnet().chainId]: {},
            },
        });

        mockSignData = vi.fn();
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    const setupMockWallet = () => {
        const mockWallet = {
            getAddress: () => 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
            getWalletId: () => 'mock-wallet-id',
            signData: mockSignData,
        } as unknown as WalletInterface;

        appKit.walletsManager.setWallets([mockWallet]);
        return mockWallet;
    };

    describe('signTextExample', () => {
        it('should log signature for text', async () => {
            setupMockWallet();
            mockSignData.mockResolvedValue({ signature: 'mock-signature' });

            await signTextExample(appKit);

            expect(mockSignData).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('Signature:', 'mock-signature');
        });
    });

    describe('signBinaryExample', () => {
        it('should log binary signature', async () => {
            setupMockWallet();
            mockSignData.mockResolvedValue({ signature: 'mock-binary-signature' });

            await signBinaryExample(appKit);

            expect(mockSignData).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('Binary Signature:', 'mock-binary-signature');
        });
    });

    describe('signCellExample', () => {
        it('should log cell signature', async () => {
            setupMockWallet();
            mockSignData.mockResolvedValue({ signature: 'mock-cell-signature' });

            await signCellExample(appKit);

            expect(mockSignData).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('Cell Signature:', 'mock-cell-signature');
        });
    });
});
