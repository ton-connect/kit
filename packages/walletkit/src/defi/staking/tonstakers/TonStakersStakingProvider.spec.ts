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
import { StakingQuoteDirection, UnstakeMode } from '../types';
import { CONTRACT } from './constants';
import { Network } from '../../../api/models';
import type { Base64String } from '../../../api/models';

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
    let getPoolDataSpy: MockInstance;
    let calculateApySpy: MockInstance;

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

        getPoolDataSpy = vi.spyOn(PoolContract.prototype, 'getPoolData').mockResolvedValue({
            state: 0,
            halted: false,
            totalBalance: '1000000000000',
            supply: '900000000000',
            interestRatePercent: 0.1,
        });

        calculateApySpy = vi.spyOn(PoolContract.prototype, 'calculateApy').mockReturnValue(0.05);

        vi.spyOn(PoolContract.prototype, 'getPoolBalance').mockResolvedValue(500000000000n);

        provider = new TonStakersStakingProvider(mockNetworkManager as never, mockEventEmitter as never);
    });

    describe('getQuote', () => {
        it('should return correct quote with APY for stake direction', async () => {
            const amount = '1000000000';
            const quote = await provider.getQuote({
                direction: StakingQuoteDirection.Stake,
                amount,
                userAddress: testUserAddress,
                network: Network.mainnet(),
            });

            expect(quote.direction).toBe(StakingQuoteDirection.Stake);
            expect(quote.amountIn).toBe(amount);
            expect(quote.amountOut).toBe(amount);
            expect(quote.provider).toBe('tonstakers');
            expect(quote.apy).toBe(0.05);
            expect(getPoolDataSpy).toHaveBeenCalled();
            expect(calculateApySpy).toHaveBeenCalledWith(0.1);
        });

        it('should return correct quote with unstakeMode for unstake direction', async () => {
            const amount = '1000000000';
            const quote = await provider.getQuote({
                direction: StakingQuoteDirection.Unstake,
                amount,
                userAddress: testUserAddress,
                network: Network.mainnet(),
                unstakeMode: UnstakeMode.Instant,
            });

            expect(quote.direction).toBe(StakingQuoteDirection.Unstake);
            expect(quote.amountIn).toBe(amount);
            expect(quote.amountOut).toBe(amount);
            expect(quote.provider).toBe('tonstakers');
            expect(quote.unstakeMode).toBe(UnstakeMode.Instant);
        });

        it('should default to Delayed unstakeMode when not specified', async () => {
            const quote = await provider.getQuote({
                direction: StakingQuoteDirection.Unstake,
                amount: '1000000000',
                network: Network.mainnet(),
            });

            expect(quote.unstakeMode).toBe(UnstakeMode.Delayed);
        });
    });

    describe('stake', () => {
        it('should build correct transaction with stake payload', async () => {
            const amount = '1000000000';
            const tx = await provider.stake({
                amount,
                userAddress: testUserAddress,
                network: Network.mainnet(),
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
            const tx = await provider.unstake({
                amount: '1000000000',
                userAddress: testUserAddress,
                network: Network.mainnet(),
                unstakeMode: UnstakeMode.Delayed,
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
            await provider.unstake({
                amount: '1000000000',
                userAddress: testUserAddress,
                network: Network.mainnet(),
                unstakeMode: UnstakeMode.Instant,
            });

            expect(buildUnstakeMessageSpy).toHaveBeenCalledWith({
                amount: 1000000000n,
                userAddress: testUserAddress,
                waitTillRoundEnd: false,
                fillOrKill: true,
            });
        });

        it('should build correct transaction for BestRate mode', async () => {
            await provider.unstake({
                amount: '1000000000',
                userAddress: testUserAddress,
                network: Network.mainnet(),
                unstakeMode: UnstakeMode.BestRate,
            });

            expect(buildUnstakeMessageSpy).toHaveBeenCalledWith({
                amount: 1000000000n,
                userAddress: testUserAddress,
                waitTillRoundEnd: true,
                fillOrKill: false,
            });
        });

        it('should default to Delayed mode when unstakeMode not specified', async () => {
            await provider.unstake({
                amount: '1000000000',
                userAddress: testUserAddress,
                network: Network.mainnet(),
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
            { mode: UnstakeMode.Delayed, waitTillRoundEnd: false, fillOrKill: false },
            { mode: UnstakeMode.Instant, waitTillRoundEnd: false, fillOrKill: true },
            { mode: UnstakeMode.BestRate, waitTillRoundEnd: true, fillOrKill: false },
        ])('should set correct flags for $mode mode', async ({ mode, waitTillRoundEnd, fillOrKill }) => {
            await provider.unstake({
                amount: '1000000000',
                userAddress: testUserAddress,
                network: Network.mainnet(),
                unstakeMode: mode,
            });

            expect(buildUnstakeMessageSpy).toHaveBeenCalledWith(
                expect.objectContaining({
                    waitTillRoundEnd,
                    fillOrKill,
                }),
            );
        });
    });
});
