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

import { UseSwapQuoteExample } from './use-swap-quote';
import { UseBuildSwapTransactionExample } from './use-build-swap-transaction';

// Mock the whole module
vi.mock('@ton/appkit-react', async () => {
    const actual = await vi.importActual('@ton/appkit-react');
    return {
        ...actual,
        useSwapQuote: vi.fn(),
        useBuildSwapTransaction: vi.fn(),
        useSendTransaction: vi.fn(),
    };
});

describe('Swap Hooks Examples', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('UseSwapQuoteExample', () => {
        it('should render loading state', () => {
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useSwapQuote).mockReturnValue({
                isLoading: true,
                data: undefined,
                error: null,
            });

            render(<UseSwapQuoteExample />);
            expect(screen.getByText('Loading quote...')).toBeDefined();
        });

        it('should render error state', () => {
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useSwapQuote).mockReturnValue({
                isLoading: false,
                data: undefined,
                error: new Error('Quote failed'),
            });

            render(<UseSwapQuoteExample />);
            expect(screen.getByText('Error: Quote failed')).toBeDefined();
        });

        it('should render quote details', () => {
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useSwapQuote).mockReturnValue({
                isLoading: false,
                data: {
                    toAmount: '0.99',
                    priceImpact: '0.01',
                },
                error: null,
            });

            render(<UseSwapQuoteExample />);
            expect(screen.getByText('Expected Output: 0.99')).toBeDefined();
            expect(screen.getByText('Price Impact: 0.01')).toBeDefined();
        });
    });

    describe('UseBuildSwapTransactionExample', () => {
        it('should call buildTx and sendTx on button click', async () => {
            const mockQuote = { toAmount: '0.99' };
            const mockTransaction = { to: 'address', value: '100' };
            const mockBuildTx = vi.fn().mockResolvedValue(mockTransaction);
            const mockSendTx = vi.fn().mockResolvedValue(true);

            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useSwapQuote).mockReturnValue({
                data: mockQuote,
                isLoading: false,
                error: null,
            });

            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useBuildSwapTransaction).mockReturnValue({
                mutateAsync: mockBuildTx,
                isPending: false,
            });

            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useSendTransaction).mockReturnValue({
                mutateAsync: mockSendTx,
                isPending: false,
            });

            render(<UseBuildSwapTransactionExample />);
            const button = screen.getByText('Swap');
            fireEvent.click(button);

            await waitFor(() => {
                expect(mockBuildTx).toHaveBeenCalledWith({
                    quote: mockQuote,
                    userAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
                    slippageBps: 100,
                });
            });

            await waitFor(() => {
                expect(mockSendTx).toHaveBeenCalledWith(mockTransaction);
            });
        });

        it('should disable button when processing', () => {
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useSwapQuote).mockReturnValue({
                data: { toAmount: '0.99' },
                isLoading: false,
            });

            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useBuildSwapTransaction).mockReturnValue({
                mutateAsync: vi.fn(),
                isPending: true,
            });

            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useSendTransaction).mockReturnValue({
                mutateAsync: vi.fn(),
                isPending: false,
            });

            render(<UseBuildSwapTransactionExample />);
            const button = screen.getByText('Processing...');
            expect(button.closest('button')?.disabled).toBe(true);
        });
    });
});
