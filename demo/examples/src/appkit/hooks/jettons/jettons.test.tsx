/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import * as AppKitReact from '@ton/appkit-react';

import { UseJettonInfoExample } from './use-jetton-info';
import { UseJettonBalanceByAddressExample } from './use-jetton-balance-by-address';
import { UseJettonWalletAddressExample } from './use-jetton-wallet-address';
import { UseJettonsByAddressExample } from './use-jettons-by-address';
import { UseJettonsExample } from './use-jettons';
import { UseTransferJettonExample } from './use-transfer-jetton';
import { UseWatchJettonsByAddressExample } from './use-watch-jettons-by-address';
import { UseWatchJettonsExample } from './use-watch-jettons';

// Mock the whole module
vi.mock('@ton/appkit-react', async () => {
    const actual = await vi.importActual('@ton/appkit-react');
    return {
        ...actual,
        useJettonInfo: vi.fn(),
        useJettonBalanceByAddress: vi.fn(),
        useJettonWalletAddress: vi.fn(),
        useJettonsByAddress: vi.fn(),
        useJettons: vi.fn(),
        useTransferJetton: vi.fn(),
        useWatchJettons: vi.fn(),
        useWatchJettonsByAddress: vi.fn(),
    };
});

describe('Jetton Hooks Examples', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        cleanup();
    });

    describe('UseJettonInfoExample', () => {
        it('should render loading state', () => {
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useJettonInfo).mockReturnValue({
                isLoading: true,
                data: undefined,
                error: null,
            });

            render(<UseJettonInfoExample />);
            expect(screen.getByText('Loading...')).toBeDefined();
        });

        it('should render error state', () => {
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useJettonInfo).mockReturnValue({
                isLoading: false,
                data: undefined,
                error: new Error('Failed to fetch'),
            });

            render(<UseJettonInfoExample />);
            expect(screen.getByText('Error: Failed to fetch')).toBeDefined();
        });

        it('should render jetton info', () => {
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useJettonInfo).mockReturnValue({
                isLoading: false,
                data: {
                    name: 'Test Jetton',
                    symbol: 'TEST',
                    decimals: 9,
                },
                error: null,
            });

            render(<UseJettonInfoExample />);
            expect(screen.getByText('Name: Test Jetton')).toBeDefined();
            expect(screen.getByText('Symbol: TEST')).toBeDefined();
            expect(screen.getByText('Decimals: 9')).toBeDefined();
        });
    });

    describe('UseJettonBalanceByAddressExample', () => {
        it('should render balance', () => {
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useJettonBalanceByAddress).mockReturnValue({
                isLoading: false,
                data: '1000000',
                error: null,
            });

            render(<UseJettonBalanceByAddressExample />);
            expect(screen.getByText('Jetton Balance: 1000000')).toBeDefined();
        });
    });

    describe('UseJettonWalletAddressExample', () => {
        it('should render wallet address', () => {
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useJettonWalletAddress).mockReturnValue({
                isLoading: false,
                data: 'EQB-mock-address',
                error: null,
            });

            render(<UseJettonWalletAddressExample />);
            expect(screen.getByText('Jetton Wallet Address: EQB-mock-address')).toBeDefined();
        });
    });

    describe('UseJettonsByAddressExample', () => {
        it('should render list of jettons', () => {
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useJettonsByAddress).mockReturnValue({
                isLoading: false,
                data: {
                    jettons: [
                        { walletAddress: 'addr1', info: { name: 'Jetton 1' }, balance: '10' },
                        { walletAddress: 'addr2', info: { name: 'Jetton 2' }, balance: '20' },
                    ],
                },
                error: null,
            });

            render(<UseJettonsByAddressExample />);
            expect(screen.getByText('Jetton 1: 10')).toBeDefined();
            expect(screen.getByText('Jetton 2: 20')).toBeDefined();
        });
    });

    describe('UseJettonsExample', () => {
        it('should render list of jettons for current wallet', () => {
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useJettons).mockReturnValue({
                isLoading: false,
                data: {
                    jettons: [{ walletAddress: 'addr1', info: { name: 'My Jetton' }, balance: '100' }],
                },
                error: null,
            });

            render(<UseJettonsExample />);
            expect(screen.getByText('My Jetton: 100')).toBeDefined();
        });
    });

    describe('UseTransferJettonExample', () => {
        it('should call transfer mutation on button click', () => {
            const mockMutate = vi.fn();
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useTransferJetton).mockReturnValue({
                mutate: mockMutate,
                isPending: false,
                error: null,
            });

            render(<UseTransferJettonExample />);
            const button = screen.getByText('Transfer Jetton');
            fireEvent.click(button);

            expect(mockMutate).toHaveBeenCalledWith({
                recipientAddress: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
                amount: '100',
                jettonAddress: 'EQCxE6mUtQJKFnGfaROTKOt1lZbDiiX1kCixRv7Nw2Id_sDs',
                jettonDecimals: 6,
            });
        });

        it('should disable button when loading', () => {
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useTransferJetton).mockReturnValue({
                mutate: vi.fn(),
                isPending: true,
                error: null,
            });

            render(<UseTransferJettonExample />);
            const button = screen.getByText('Transferring...');
            expect(button.closest('button')?.disabled).toBe(true);
        });
    });

    describe('UseWatchJettonsExample', () => {
        it('should render jetton list', () => {
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useJettons).mockReturnValue({
                isLoading: false,
                data: {
                    jettons: [{ walletAddress: 'addr1', info: { name: 'My Jetton' }, balance: '100' }],
                },
                error: null,
            });

            render(<UseWatchJettonsExample />);
            expect(screen.getByText('My Jetton: 100')).toBeDefined();
            expect(AppKitReact.useWatchJettons).toHaveBeenCalled();
        });
    });

    describe('UseWatchJettonsByAddressExample', () => {
        it('should render jetton list for address', () => {
            // @ts-expect-error - mock
            vi.mocked(AppKitReact.useJettonsByAddress).mockReturnValue({
                isLoading: false,
                data: {
                    jettons: [{ walletAddress: 'addr2', info: { name: 'Other Jetton' }, balance: '50' }],
                },
                error: null,
            });

            render(<UseWatchJettonsByAddressExample />);
            expect(screen.getByText('Other Jetton: 50')).toBeDefined();
            expect(AppKitReact.useWatchJettonsByAddress).toHaveBeenCalledWith({
                address: 'UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ',
            });
        });
    });
});
