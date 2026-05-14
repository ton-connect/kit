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

import { stakingExample } from './staking-actions';

describe('Staking Actions Examples', () => {
    let appKit: AppKit;
    let consoleSpy: ReturnType<typeof vi.spyOn>;
    let mockGetQuote: ReturnType<typeof vi.fn>;
    let mockBuildStakeTransaction: ReturnType<typeof vi.fn>;
    let mockGetStakedBalance: ReturnType<typeof vi.fn>;
    let mockGetStakingProviderInfo: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        appKit = new AppKit({
            networks: {
                [Network.mainnet().chainId]: {},
            },
        });

        mockGetQuote = vi.fn();
        mockBuildStakeTransaction = vi.fn();
        mockGetStakedBalance = vi.fn();
        mockGetStakingProviderInfo = vi.fn();

        vi.spyOn(appKit.stakingManager, 'getProvider').mockImplementation(
            (id) =>
                ({
                    providerId: id || 'tonstakers',
                    getStakingProviderMetadata: () => ({
                        name: 'Tonstakers',
                        receiveToken: { ticker: 'tsTON', decimals: 9, address: 'ton' },
                    }),
                }) as never,
        );
        vi.spyOn(appKit.stakingManager, 'getProviders').mockReturnValue([]);
        // @ts-expect-error - internal access
        vi.spyOn(appKit.stakingManager, 'getQuote').mockImplementation(mockGetQuote);
        // @ts-expect-error - internal access
        vi.spyOn(appKit.stakingManager, 'buildStakeTransaction').mockImplementation(mockBuildStakeTransaction);
        // @ts-expect-error - internal access
        vi.spyOn(appKit.stakingManager, 'getStakedBalance').mockImplementation(mockGetStakedBalance);
        // @ts-expect-error - internal access
        vi.spyOn(appKit.stakingManager, 'getStakingProviderInfo').mockImplementation(mockGetStakingProviderInfo);
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    const setupMockWallet = () => {
        const mockWallet = {
            getAddress: () => 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
            getWalletId: () => 'mock-wallet-id',
            getNetwork: () => 'mainnet',
            sendTransaction: vi.fn(),
        } as unknown as WalletInterface;

        appKit.walletsManager.setWallets([mockWallet]);
        return mockWallet;
    };

    describe('stakingExample', () => {
        it('should complete the full staking flow', async () => {
            setupMockWallet();
            const mockQuote = { amountOut: '1.05' };
            const mockTxRequest = { messages: [] };
            const mockBalance = { stakedBalance: '42' };
            const mockInfo = { apy: '4.2%' };

            mockGetQuote.mockResolvedValue(mockQuote);
            mockBuildStakeTransaction.mockResolvedValue(mockTxRequest);
            mockGetStakedBalance.mockResolvedValue(mockBalance);
            mockGetStakingProviderInfo.mockResolvedValue(mockInfo);

            await stakingExample(appKit);

            expect(mockGetQuote).toHaveBeenCalled();
            expect(mockBuildStakeTransaction).toHaveBeenCalled();
            expect(mockGetStakedBalance).toHaveBeenCalled();
            expect(mockGetStakingProviderInfo).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith('Staking Quote:', mockQuote);
            expect(consoleSpy).toHaveBeenCalledWith('Stake Transaction:', mockTxRequest);
            expect(consoleSpy).toHaveBeenCalledWith('Staked Balance:', mockBalance);
            expect(consoleSpy).toHaveBeenCalledWith('Provider Info:', mockInfo);
        });
    });
});
