/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import * as AppKitReact from '@ton/appkit-react';

import { UseStakingProvidersExample } from './use-staking-providers';
import { UseStakingProviderExample } from './use-staking-provider';
import { UseStakingQuoteExample } from './use-staking-quote';
import { UseStakedBalanceExample } from './use-staked-balance';
import { UseStakingProviderInfoExample } from './use-staking-provider-info';
import { UseStakingProviderMetadataExample } from './use-staking-provider-metadata';
import { UseBuildStakeTransactionExample } from './use-build-stake-transaction';

vi.mock('@ton/appkit-react', async () => {
    const actual = await vi.importActual('@ton/appkit-react');
    return {
        ...actual,
        useStakingProviders: vi.fn(),
        useStakingProvider: vi.fn(),
        useStakingQuote: vi.fn(),
        useStakedBalance: vi.fn(),
        useStakingProviderInfo: vi.fn(),
        useStakingProviderMetadata: vi.fn(),
        useBuildStakeTransaction: vi.fn(),
        useSendTransaction: vi.fn(),
    };
});

describe('Staking Hooks Examples', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('UseStakingProvidersExample', () => {
        it('should render the list of provider ids', () => {
            vi.mocked(AppKitReact.useStakingProviders).mockReturnValue([
                { providerId: 'tonstakers' },
                { providerId: 'whales' },
            ] as unknown as AppKitReact.UseStakingProvidersReturnType);

            render(<UseStakingProvidersExample />);
            expect(screen.getByText('tonstakers')).toBeDefined();
            expect(screen.getByText('whales')).toBeDefined();
        });
    });

    describe('UseStakingProviderExample', () => {
        it('should render staking provider', () => {
            vi.mocked(AppKitReact.useStakingProvider).mockReturnValue({
                providerId: 'tonstakers',
            } as unknown as AppKitReact.UseStakingProviderReturnType);

            render(<UseStakingProviderExample />);
            expect(screen.getByText('Result: tonstakers')).toBeDefined();
        });
    });

    describe('UseStakingQuoteExample', () => {
        it('should render loading state', () => {
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useStakingQuote).mockReturnValue({
                isLoading: true,
                data: undefined,
                error: null,
            });

            render(<UseStakingQuoteExample />);
            expect(screen.getByText('Loading quote...')).toBeDefined();
        });

        it('should render quote amount', () => {
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useStakingQuote).mockReturnValue({
                isLoading: false,
                data: { amountOut: '1.05' },
                error: null,
            });

            render(<UseStakingQuoteExample />);
            expect(screen.getByText('Expected Output: 1.05')).toBeDefined();
        });
    });

    describe('UseStakedBalanceExample', () => {
        it('should render balance', () => {
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useStakedBalance).mockReturnValue({
                isLoading: false,
                data: { stakedBalance: '42' },
            });

            render(<UseStakedBalanceExample />);
            expect(screen.getByText('Staked Balance: 42')).toBeDefined();
        });
    });

    describe('UseStakingProviderInfoExample', () => {
        it('should render APY', () => {
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useStakingProviderInfo).mockReturnValue({
                isLoading: false,
                data: { apy: '4.2%' },
            });

            render(<UseStakingProviderInfoExample />);
            expect(screen.getByText('APY: 4.2%')).toBeDefined();
        });
    });

    describe('UseStakingProviderMetadataExample', () => {
        it('should render receive token ticker', () => {
            vi.mocked(AppKitReact.useStakingProviderMetadata).mockReturnValue({
                receiveToken: { ticker: 'tsTON' },
            } as unknown as AppKitReact.UseStakingProviderMetadataReturnType);

            render(<UseStakingProviderMetadataExample />);
            expect(screen.getByText('Receive Token: tsTON')).toBeDefined();
        });
    });

    describe('UseBuildStakeTransactionExample', () => {
        it('should call buildTx and sendTx on button click', async () => {
            const mockQuote = { amountOut: '1.05' };
            const mockTransaction = { to: 'address', value: '100' };
            const mockBuildTx = vi.fn().mockResolvedValue(mockTransaction);
            const mockSendTx = vi.fn().mockResolvedValue(true);

            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useStakingQuote).mockReturnValue({
                data: mockQuote,
                isLoading: false,
                error: null,
            });

            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useBuildStakeTransaction).mockReturnValue({
                mutateAsync: mockBuildTx,
                isPending: false,
            });

            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useSendTransaction).mockReturnValue({
                mutateAsync: mockSendTx,
                isPending: false,
            });

            render(<UseBuildStakeTransactionExample />);
            fireEvent.click(screen.getByText('Stake'));

            await waitFor(() => {
                expect(mockBuildTx).toHaveBeenCalledWith({
                    quote: mockQuote,
                    userAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
                });
            });

            await waitFor(() => {
                expect(mockSendTx).toHaveBeenCalledWith(mockTransaction);
            });
        });

        it('should disable button when processing', () => {
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useStakingQuote).mockReturnValue({
                data: { amountOut: '1.05' },
                isLoading: false,
            });

            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useBuildStakeTransaction).mockReturnValue({
                mutateAsync: vi.fn(),
                isPending: true,
            });

            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useSendTransaction).mockReturnValue({
                mutateAsync: vi.fn(),
                isPending: false,
            });

            render(<UseBuildStakeTransactionExample />);
            const button = screen.getByText('Processing...');
            expect(button.closest('button')?.disabled).toBe(true);
        });
    });
});
