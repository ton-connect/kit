/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockInstance } from 'vitest';

import type { NetworkManager } from '../../../core/NetworkManager';
import type { TonStakersStakingProvider } from './TonStakersStakingProvider';
import { createTonstakersProvider } from './TonStakersStakingProvider';
import { PoolContract } from './PoolContract';
import { CONTRACT } from './constants';
import { Network, UnstakeMode } from '../../../api/models';
import type { Base64String, UserFriendlyAddress } from '../../../api/models';
import type { ApiClient } from '../../../types/toncenter/ApiClient';

const mockApiClient = {
    runGetMethod: vi.fn(),
    getBalance: vi.fn(),
};

describe('TonStakersStakingProvider', () => {
    let provider: TonStakersStakingProvider;
    const testUserAddress = 'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2';

    let buildStakePayloadSpy: MockInstance;
    let buildUnstakeMessageSpy: MockInstance;
    let getApyFromTonApiSpy: MockInstance;

    beforeEach(() => {
        vi.clearAllMocks();

        buildStakePayloadSpy = vi
            .spyOn(PoolContract.prototype, 'buildStakePayload')
            .mockReturnValue('mock-stake-payload' as Base64String);

        buildUnstakeMessageSpy = vi.spyOn(PoolContract.prototype, 'buildUnstakeMessage').mockResolvedValue({
            address: 'EQMockJettonWallet',
            amount: CONTRACT.UNSTAKE_FEE_RES.toString(),
            payload: 'mock-unstake-payload' as Base64String,
        });
        vi.spyOn(PoolContract.prototype, 'getPoolBalance').mockResolvedValue(500000000000n);
        vi.spyOn(PoolContract.prototype, 'getRates').mockResolvedValue({
            tsTONTON: 1.05,
            tsTONTONProjected: 1.1,
        });

        const mockNetworkManager: NetworkManager = {
            getClient: () => mockApiClient as unknown as ApiClient,
            hasNetwork: () => true,
            getConfiguredNetworks: () => [Network.mainnet()],
            setClient: vi.fn(),
        };

        const factory = createTonstakersProvider({
            [Network.mainnet().chainId]: {
                contractAddress: 'EQCkWxfyhAkim3g2DjKQQg8T5P4g-Q1-K_jErGcDJZ4i-vqR' as UserFriendlyAddress,
            },
        });
        provider = factory({ networkManager: mockNetworkManager });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getApyFromTonApiSpy = vi.spyOn(provider as any, 'getApyFromTonApi').mockResolvedValue(0.05);
    });

    describe('getQuote', () => {
        it('should return correct quote with APY for stake direction', async () => {
            const amount = '1';
            const quote = await provider.getQuote({
                direction: 'stake',
                amount,
                userAddress: testUserAddress,
                network: Network.mainnet(),
            });

            expect(quote.direction).toBe('stake');
            expect(quote.rawAmountIn).toBe('1000000000');
            expect(quote.amountIn).toBe(amount);
            expect(quote.rawAmountOut).toBe('909090909');
            // amountOut = 1 / 1.1 = 0.909090909
            expect(quote.amountOut).toBe('0.909090909');
            expect(quote.providerId).toBe('tonstakers');
            expect(quote.apy).toBe(0.05);
            expect(getApyFromTonApiSpy).toHaveBeenCalled();
        });

        it('should return correct quote with INSTANT unstake (spot rate)', async () => {
            const amount = '1';
            const quote = await provider.getQuote({
                direction: 'unstake',
                amount,
                userAddress: testUserAddress,
                network: Network.mainnet(),
                unstakeMode: UnstakeMode.INSTANT,
            });

            expect(quote.direction).toBe('unstake');
            expect(quote.rawAmountIn).toBe('1000000000');
            expect(quote.amountIn).toBe(amount);
            expect(quote.rawAmountOut).toBe('1050000000');
            expect(quote.amountOut).toBe('1.05');
            expect(quote.providerId).toBe('tonstakers');
            expect(quote.unstakeMode).toBe(UnstakeMode.INSTANT);
        });

        it('should default unstakeMode to INSTANT when not specified', async () => {
            const quote = await provider.getQuote({
                direction: 'unstake',
                amount: '1',
                network: Network.mainnet(),
            });

            expect(quote.unstakeMode).toBe(UnstakeMode.INSTANT);
        });
    });

    describe('stake', () => {
        it('should build correct transaction with stake payload', async () => {
            const amount = '1';
            const quote = await provider.getQuote({
                direction: 'stake',
                amount,
                userAddress: testUserAddress,
                network: Network.mainnet(),
            });

            const tx = await provider.buildStakeTransaction({
                quote,
                userAddress: testUserAddress,
            });

            expect(tx.fromAddress).toBe(testUserAddress);
            expect(tx.network).toEqual(Network.mainnet());
            expect(tx.messages).toHaveLength(1);

            const message = tx.messages[0];
            expect(message.address).toBe('EQCkWxfyhAkim3g2DjKQQg8T5P4g-Q1-K_jErGcDJZ4i-vqR');
            expect(message.payload).toBe('mock-stake-payload');

            const expectedAmount = CONTRACT.STAKE_FEE_RES + 1000000000n;
            expect(message.amount).toBe(expectedAmount.toString());

            expect(buildStakePayloadSpy).toHaveBeenCalledWith(1n);
        });
    });

    describe('unstake', () => {
        it('should build correct transaction for WHEN_AVAILABLE mode', async () => {
            const amount = '1';
            const quote = await provider.getQuote({
                direction: 'unstake',
                amount,
                userAddress: testUserAddress,
                network: Network.mainnet(),
                unstakeMode: UnstakeMode.WHEN_AVAILABLE,
            });

            const tx = await provider.buildStakeTransaction({
                quote,
                userAddress: testUserAddress,
            });

            expect(tx.fromAddress).toBe(testUserAddress);
            expect(tx.messages).toHaveLength(1);
            expect(tx.messages[0].address).toBe('EQMockJettonWallet');
            expect(tx.messages[0].payload).toBe('mock-unstake-payload');

            expect(buildUnstakeMessageSpy).toHaveBeenCalledWith({
                amount: 1000000000n,
                userAddress: testUserAddress,
                waitTillRoundEnd: false,
                fillOrKill: false,
            });
        });

        it('should build correct transaction for INSTANT mode', async () => {
            const amount = '1';
            const quote = await provider.getQuote({
                direction: 'unstake',
                amount,
                userAddress: testUserAddress,
                network: Network.mainnet(),
                unstakeMode: UnstakeMode.INSTANT,
            });

            await provider.buildStakeTransaction({
                quote,
                userAddress: testUserAddress,
            });

            expect(buildUnstakeMessageSpy).toHaveBeenCalledWith({
                amount: 1000000000n,
                userAddress: testUserAddress,
                waitTillRoundEnd: false,
                fillOrKill: true,
            });
        });

        it('should build correct transaction for ROUND_END mode', async () => {
            const amount = '1';
            const quote = await provider.getQuote({
                direction: 'unstake',
                amount,
                userAddress: testUserAddress,
                network: Network.mainnet(),
                unstakeMode: UnstakeMode.ROUND_END,
            });

            await provider.buildStakeTransaction({
                quote,
                userAddress: testUserAddress,
            });

            expect(buildUnstakeMessageSpy).toHaveBeenCalledWith({
                amount: 1000000000n,
                userAddress: testUserAddress,
                waitTillRoundEnd: true,
                fillOrKill: false,
            });
        });

        it('should default to INSTANT when unstakeMode not specified in quote', async () => {
            const amount = '1';
            const quote = await provider.getQuote({
                direction: 'unstake',
                amount,
                userAddress: testUserAddress,
                network: Network.mainnet(),
            });

            await provider.buildStakeTransaction({
                quote,
                userAddress: testUserAddress,
            });

            expect(buildUnstakeMessageSpy).toHaveBeenCalledWith({
                amount: 1000000000n,
                userAddress: testUserAddress,
                waitTillRoundEnd: false,
                fillOrKill: true,
            });
        });
    });

    describe('unstake mode flags', () => {
        it.each([
            { mode: UnstakeMode.WHEN_AVAILABLE, waitTillRoundEnd: false, fillOrKill: false },
            { mode: UnstakeMode.INSTANT, waitTillRoundEnd: false, fillOrKill: true },
            { mode: UnstakeMode.ROUND_END, waitTillRoundEnd: true, fillOrKill: false },
        ])('should set correct flags for $mode mode', async ({ mode, waitTillRoundEnd, fillOrKill }) => {
            const amount = '1';
            const quote = await provider.getQuote({
                direction: 'unstake',
                amount,
                userAddress: testUserAddress,
                network: Network.mainnet(),
                unstakeMode: mode,
            });

            await provider.buildStakeTransaction({
                quote,
                userAddress: testUserAddress,
            });

            expect(buildUnstakeMessageSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    waitTillRoundEnd,
                    fillOrKill,
                }),
            );
        });
    });

    describe('getStakingProviderInfo', () => {
        it('should return simplified info with APY and liquidity', async () => {
            const info = await provider.getStakingProviderInfo(Network.mainnet());

            expect(info.apy).toBe(0.05);
            expect(info.rawInstantUnstakeAvailable).toBe('500000000000');
            expect(info.instantUnstakeAvailable).toBe('500');
            expect(info.providerId).toBe('tonstakers');
            // Ensure exchange rates are NOT in the response
            expect(info).not.toHaveProperty('tsTONTON');
            expect(info).not.toHaveProperty('tsTONTONProjected');
        });
    });

    describe('getStakedBalance', () => {
        it('should return user balance and provider info', async () => {
            mockApiClient.getBalance.mockResolvedValue('2000000000'); // 2 TON
            vi.spyOn(PoolContract.prototype, 'getStakedBalance').mockResolvedValue('1000000000'); // 1 tsTON

            const balance = await provider.getStakedBalance(testUserAddress, Network.mainnet());

            expect(balance.rawStakedBalance).toBe('1000000000');
            expect(balance.stakedBalance).toBe('1');
            expect(balance.rawInstantUnstakeAvailable).toBe('500000000000');
            expect(balance.instantUnstakeAvailable).toBe('500');
            expect(balance.providerId).toBe('tonstakers');
        });
    });

    describe('getSupportedUnstakeModes', () => {
        it('should return supported unstake modes', () => {
            const modes = provider.getSupportedUnstakeModes();
            expect(modes).toEqual([UnstakeMode.INSTANT, UnstakeMode.WHEN_AVAILABLE, UnstakeMode.ROUND_END]);
        });
    });
});
