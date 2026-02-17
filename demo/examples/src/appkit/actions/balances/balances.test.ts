/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppKit } from '@ton/appkit';
import type { TokenAmount } from '@ton/walletkit';
import { Network } from '@ton/walletkit';
import type { WalletInterface } from '@ton/appkit';

import { getBalanceByAddressExample } from './get-balance-by-address';
import { getBalanceExample } from './get-balance';

describe('Balance Actions Examples (Integration)', () => {
    let appKit: AppKit;
    let mockGetBalance: ReturnType<typeof vi.fn>;
    let consoleSpy: ReturnType<typeof vi.spyOn>;

    // Valid friendly address (Zero Address)
    const VALID_ADDRESS = 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c';

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
        mockGetBalance = vi.fn();
        const mockClient = {
            getBalance: mockGetBalance,
        };

        // Spy on networkManager.getClient to return our mock client
        // @ts-expect-error - exploiting internal access for testing
        vi.spyOn(appKit.networkManager, 'getClient').mockReturnValue(mockClient);
    });

    afterEach(() => {
        // AppKit doesn't have a close method, so just restoring spying
        consoleSpy.mockRestore();
    });

    describe('getBalanceExample', () => {
        it('should log balance when wallet is selected', async () => {
            // Simulate a connected wallet
            const mockWallet = {
                getAddress: () => VALID_ADDRESS,
                getWalletId: () => 'mock-wallet-id',
            } as unknown as WalletInterface;

            appKit.walletsManager.setWallets([mockWallet]);

            // Setup balance response
            // Using a simple object that mimics TokenAmount to avoid constructor issues if any,
            // or we could use `new TokenAmount(1000000000n, 9)` if available.
            // Since we test the example which calls .toString(), this is sufficient.
            const balanceValue = { toString: () => '1000000000' } as TokenAmount;
            mockGetBalance.mockResolvedValue(balanceValue);

            await getBalanceExample(appKit);

            expect(mockGetBalance).toHaveBeenCalledWith(VALID_ADDRESS);
            expect(consoleSpy).toHaveBeenCalledWith('Balance:', '1');
        });

        it('should do nothing if no wallet is selected', async () => {
            appKit.walletsManager.setWallets([]);

            await getBalanceExample(appKit);

            expect(mockGetBalance).not.toHaveBeenCalled();
            expect(consoleSpy).not.toHaveBeenCalled();
        });
    });

    describe('getBalanceByAddressExample', () => {
        it('should log balance for specific address', async () => {
            const balanceValue = { toString: () => '500000000' } as TokenAmount;
            mockGetBalance.mockResolvedValue(balanceValue);

            await getBalanceByAddressExample(appKit);

            // Expect call with the address from the example file
            expect(mockGetBalance).toHaveBeenCalledWith(VALID_ADDRESS);
            expect(consoleSpy).toHaveBeenCalledWith('Balance by address:', '0.5');
        });
    });
});
