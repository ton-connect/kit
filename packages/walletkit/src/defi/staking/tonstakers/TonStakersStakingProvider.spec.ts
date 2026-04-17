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
import { CONTRACT, DEFAULT_METADATA } from './constants';
import { Network, UnstakeMode } from '../../../api/models';
import type { Base64String, UserFriendlyAddress } from '../../../api/models';
import type { ApiClient } from '../../../types/toncenter/ApiClient';
import type { ProviderFactoryContext } from '../../../types/factory';

const mockApiClient = {
    runGetMethod: vi.fn(),
    getBalance: vi.fn(),
};

describe('TonStakersStakingProvider', () => {
    let provider: TonStakersStakingProvider;
    const testUserAddress = 'EQDtFpEwcFAEcRe5mLVh2N6C0x-_hJEM7W61_JLnSF74p4q2';

    let buildStakePayloadSpy: MockInstance;
    let buildUnstakeMessageSpy: MockInstance;

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
        // totalBalance/supply = 1050/1000 = 1.05 (spot rate)
        // projectedBalance/projectedSupply = 1100/1000 = 1.1 (projected rate)
        vi.spyOn(PoolContract.prototype, 'getPoolData').mockResolvedValue({
            totalBalance: 1050000000000n,
            supply: 1000000000000n,
            projectedBalance: 1100000000000n,
            projectedSupply: 1000000000000n,
        });

        const mockNetworkManager: NetworkManager = {
            getClient: () => mockApiClient as unknown as ApiClient,
            hasNetwork: () => true,
            getConfiguredNetworks: () => [Network.mainnet()],
            setClient: vi.fn(),
        };

        const factory = createTonstakersProvider({
            [Network.mainnet().chainId]: {
                metadata: {
                    contractAddress: 'EQCkWxfyhAkim3g2DjKQQg8T5P4g-Q1-K_jErGcDJZ4i-vqR' as UserFriendlyAddress,
                },
            },
        });
        provider = factory({ networkManager: mockNetworkManager } as ProviderFactoryContext);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.spyOn(provider as any, 'getApyFromTonApi').mockResolvedValue(0.05);
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

        it('should return correct reversed quote with INSTANT unstake (spot rate)', async () => {
            // User says "I want 1 TON out", provider calculates tsTON to burn
            // tsTON_in = 1 TON * supply / totalBalance = 1 * 1000/1050 = 0.952380952
            const quote = await provider.getQuote({
                direction: 'unstake',
                amount: '1',
                userAddress: testUserAddress,
                network: Network.mainnet(),
                unstakeMode: UnstakeMode.INSTANT,
                isReversed: true,
            });

            expect(quote.direction).toBe('unstake');
            expect(quote.amountOut).toBe('1');
            expect(quote.rawAmountOut).toBe('1000000000');
            expect(quote.amountIn).toBe('0.952380952');
            expect(quote.rawAmountIn).toBe('952380952');
            expect(quote.unstakeMode).toBe(UnstakeMode.INSTANT);
        });

        it('should return correct reversed quote with ROUND_END unstake (projected rate)', async () => {
            // tsTON_in = 1 TON * projectedSupply / projectedBalance = 1 * 1000/1100 = 0.909090909
            const quote = await provider.getQuote({
                direction: 'unstake',
                amount: '1',
                userAddress: testUserAddress,
                network: Network.mainnet(),
                unstakeMode: UnstakeMode.ROUND_END,
                isReversed: true,
            });

            expect(quote.direction).toBe('unstake');
            expect(quote.amountOut).toBe('1');
            expect(quote.amountIn).toBe('0.909090909');
            expect(quote.unstakeMode).toBe(UnstakeMode.ROUND_END);
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
            expect(info.exchangeRate).toBe('1.05');
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

    describe('getStakingProviderMetadata', () => {
        it('should return supported unstake modes', () => {
            const metadata = provider.getStakingProviderMetadata(Network.mainnet());
            expect(metadata.supportedUnstakeModes).toEqual([
                UnstakeMode.INSTANT,
                UnstakeMode.WHEN_AVAILABLE,
                UnstakeMode.ROUND_END,
            ]);
        });

        it('should return provider metadata with token info', () => {
            const metadata = provider.getStakingProviderMetadata(Network.mainnet());
            expect(metadata.stakeToken.ticker).toBe('TON');
            expect(metadata.stakeToken.decimals).toBe(9);
            expect(metadata.receiveToken?.ticker).toBe('tsTON');
            expect(metadata.receiveToken?.decimals).toBe(9);
            expect(metadata.supportsReversedQuote).toBe(true);
        });

        it('should use default receiveToken address from DEFAULT_METADATA for mainnet', () => {
            const metadata = provider.getStakingProviderMetadata(Network.mainnet());
            expect(metadata.receiveToken?.address).toBe(
                DEFAULT_METADATA[Network.mainnet().chainId].receiveToken?.address,
            );
        });

        it('should use default receiveToken address from DEFAULT_METADATA for testnet', () => {
            const mockNetworkManager: NetworkManager = {
                getClient: () => mockApiClient as unknown as ApiClient,
                hasNetwork: () => true,
                getConfiguredNetworks: () => [Network.testnet()],
                setClient: vi.fn(),
            };
            const testnetProvider = createTonstakersProvider()({
                networkManager: mockNetworkManager,
            } as ProviderFactoryContext);

            const metadata = testnetProvider.getStakingProviderMetadata(Network.testnet());
            expect(metadata.receiveToken?.address).toBe(
                DEFAULT_METADATA[Network.testnet().chainId].receiveToken?.address,
            );
        });

        it('should prefer receiveToken from config metadata over the default', () => {
            const customAddress = 'EQCustomReceiveToken' as UserFriendlyAddress;
            const mockNetworkManager: NetworkManager = {
                getClient: () => mockApiClient as unknown as ApiClient,
                hasNetwork: () => true,
                getConfiguredNetworks: () => [Network.mainnet()],
                setClient: vi.fn(),
            };
            const customProvider = createTonstakersProvider({
                [Network.mainnet().chainId]: {
                    metadata: { receiveToken: { ticker: 'CUSTOM', decimals: 9, address: customAddress } },
                },
            })({ networkManager: mockNetworkManager } as ProviderFactoryContext);

            const metadata = customProvider.getStakingProviderMetadata(Network.mainnet());
            expect(metadata.receiveToken?.address).toBe(customAddress);
            expect(metadata.receiveToken?.ticker).toBe('CUSTOM');
        });

        it('should throw when metadata is not available for the network', () => {
            expect(() => provider.getStakingProviderMetadata(Network.testnet())).toThrow();
        });

        it('should throw on construction when custom network has incomplete metadata', () => {
            const customNetwork = Network.custom('custom-chain-id');
            const customNetworkManager: NetworkManager = {
                getClient: () => mockApiClient as unknown as ApiClient,
                hasNetwork: () => true,
                getConfiguredNetworks: () => [customNetwork],
                setClient: vi.fn(),
            };

            expect(() =>
                createTonstakersProvider({
                    [customNetwork.chainId]: {
                        metadata: {
                            contractAddress: 'EQSomeContract' as UserFriendlyAddress,
                        },
                    },
                })({ networkManager: customNetworkManager } as ProviderFactoryContext),
            ).toThrow('Invalid metadata configuration');
        });

        it('should succeed with complete custom network metadata', () => {
            const customNetwork = Network.custom('custom-chain-id');
            const customNetworkManager: NetworkManager = {
                getClient: () => mockApiClient as unknown as ApiClient,
                hasNetwork: () => true,
                getConfiguredNetworks: () => [customNetwork],
                setClient: vi.fn(),
            };
            const customProvider = createTonstakersProvider({
                [customNetwork.chainId]: {
                    metadata: {
                        stakeToken: { ticker: 'TON', decimals: 9, address: 'ton' },
                        contractAddress: 'EQSomeContract' as UserFriendlyAddress,
                        supportedUnstakeModes: [UnstakeMode.INSTANT],
                        supportsReversedQuote: false,
                    },
                },
            })({ networkManager: customNetworkManager } as ProviderFactoryContext);

            const metadata = customProvider.getStakingProviderMetadata(customNetwork);
            expect(metadata.stakeToken.ticker).toBe('TON');
            expect(metadata.receiveToken).toBeUndefined();
        });
    });
});
