/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { MockInstance } from 'vitest';

import { TonStakersStakingProvider } from './TonStakersStakingProvider';
import { PoolContract } from './PoolContract';
import { CONTRACT } from './constants';
import { Network } from '../../../api/models';
import type { Base64String, UnstakeMode } from '../../../api/models';

const mockApiClient = {
    runGetMethod: vi.fn(),
    getBalance: vi.fn(),
};

const mockNetworkManager = {
    getClient: vi.fn(() => mockApiClient),
};

const mockEventEmitter = {
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
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

        provider = new TonStakersStakingProvider(mockNetworkManager as never, mockEventEmitter as never);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        getApyFromTonApiSpy = vi.spyOn(provider as any, 'getApyFromTonApi').mockResolvedValue(0.05);
    });

    describe('getQuote', () => {
        it('should return correct quote with APY for stake direction', async () => {
            const amount = '1000000000';
            const quote = await provider.getQuote({
                direction: 'stake',
                amount,
                userAddress: testUserAddress,
                network: Network.mainnet(),
            });

            expect(quote.direction).toBe('stake');
            expect(quote.amountIn).toBe(amount);
            // amountOut = 1000000000 / 1.1 = 909090909
            expect(quote.amountOut).toBe('909090909');
            expect(quote.providerId).toBe('tonstakers');
            expect(quote.apy).toBe(0.05);
            expect(getApyFromTonApiSpy).toHaveBeenCalled();
        });

        it('should return correct quote with unstakeMode for unstake direction', async () => {
            const amount = '1000000000';
            const quote = await provider.getQuote({
                direction: 'unstake',
                amount,
                userAddress: testUserAddress,
                network: Network.mainnet(),
                unstakeMode: 'instant',
            });

            expect(quote.direction).toBe('unstake');
            expect(quote.amountIn).toBe(amount);
            // amountOut = 1000000000 * 1.05 = 1050000000
            expect(quote.amountOut).toBe('1050000000');
            expect(quote.providerId).toBe('tonstakers');
            expect(quote.unstakeMode).toBe('instant');
        });

        it('should default to Delayed unstakeMode when not specified', async () => {
            const quote = await provider.getQuote({
                direction: 'unstake',
                amount: '1000000000',
                network: Network.mainnet(),
            });

            expect(quote.unstakeMode).toBe('delayed');
        });
    });

    describe('stake', () => {
        it('should build correct transaction with stake payload', async () => {
            const amount = '1000000000';
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
            expect(message.address).toBe(CONTRACT.STAKING_CONTRACT_ADDRESS);
            expect(message.payload).toBe('mock-stake-payload');

            const expectedAmount = BigInt(amount) + CONTRACT.STAKE_FEE_RES;
            expect(message.amount).toBe(expectedAmount.toString());

            expect(buildStakePayloadSpy).toHaveBeenCalledWith(1n);
        });
    });

    describe('unstake', () => {
        it('should build correct transaction for Delayed mode', async () => {
            const amount = '1000000000';
            const quote = await provider.getQuote({
                direction: 'unstake',
                amount,
                userAddress: testUserAddress,
                network: Network.mainnet(),
                unstakeMode: 'delayed',
            });

            const tx = await provider.buildUnstakeTransaction({
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

        it('should build correct transaction for Instant mode', async () => {
            const amount = '1000000000';
            const quote = await provider.getQuote({
                direction: 'unstake',
                amount,
                userAddress: testUserAddress,
                network: Network.mainnet(),
                unstakeMode: 'instant',
            });

            await provider.buildUnstakeTransaction({
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

        it('should build correct transaction for BestRate mode', async () => {
            const amount = '1000000000';
            const quote = await provider.getQuote({
                direction: 'unstake',
                amount,
                userAddress: testUserAddress,
                network: Network.mainnet(),
                unstakeMode: 'bestRate',
            });

            await provider.buildUnstakeTransaction({
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

        it('should default to Delayed mode when unstakeMode not specified in quote', async () => {
            const amount = '1000000000';
            const quote = await provider.getQuote({
                direction: 'unstake',
                amount,
                userAddress: testUserAddress,
                network: Network.mainnet(),
            });

            await provider.buildUnstakeTransaction({
                quote,
                userAddress: testUserAddress,
            });

            expect(buildUnstakeMessageSpy).toHaveBeenCalledWith({
                amount: 1000000000n,
                userAddress: testUserAddress,
                waitTillRoundEnd: false,
                fillOrKill: false,
            });
        });
    });

    describe('unstake mode flags', () => {
        it.each([
            { mode: 'delayed', waitTillRoundEnd: false, fillOrKill: false },
            { mode: 'instant', waitTillRoundEnd: false, fillOrKill: true },
            { mode: 'bestRate', waitTillRoundEnd: true, fillOrKill: false },
        ])('should set correct flags for $mode mode', async ({ mode, waitTillRoundEnd, fillOrKill }) => {
            const amount = '1000000000';
            const quote = await provider.getQuote({
                direction: 'unstake',
                amount,
                userAddress: testUserAddress,
                network: Network.mainnet(),
                unstakeMode: mode as UnstakeMode,
            });

            await provider.buildUnstakeTransaction({
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
            expect(info.instantUnstakeAvailable).toBe('500000000000');
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

            expect(balance.stakedBalance).toBe('1000000000');
            // availableBalance = 2 TON - 1.1 TON reserve = 0.9 TON
            expect(balance.availableBalance).toBe('900000000');
            expect(balance.instantUnstakeAvailable).toBe('500000000000');
            expect(balance.providerId).toBe('tonstakers');
            expect(mockApiClient.getBalance).toHaveBeenCalledWith(testUserAddress);
        });

        it('should return 0 available balance if TON balance is below reserve', async () => {
            mockApiClient.getBalance.mockResolvedValue('500000000'); // 0.5 TON
            vi.spyOn(PoolContract.prototype, 'getStakedBalance').mockResolvedValue('0');

            const balance = await provider.getStakedBalance(testUserAddress, Network.mainnet());

            expect(balance.availableBalance).toBe('0');
        });
    });
});
