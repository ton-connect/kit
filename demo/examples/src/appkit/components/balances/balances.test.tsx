/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen, waitFor, act, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Network } from '@ton/walletkit';

import { createWrapper } from '../../../__tests__/test-utils';
import { SendTonButtonExample } from './send-ton-button';
import { SendJettonButtonExample } from './send-jetton-button';

// Mock getJettonWalletAddressFromClient from @ton/walletkit
vi.mock('@ton/walletkit', async (importOriginal) => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    const actual = await importOriginal<typeof import('@ton/walletkit')>();
    return {
        ...actual,
        getJettonWalletAddressFromClient: vi.fn().mockResolvedValue('kQD+XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX'),
        createTransferTransaction: vi.fn().mockReturnValue({
            validUntil: 1234567890,
            messages: [
                {
                    address: 'kQD+XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX',
                    amount: '100',
                    payload: 'mock-payload',
                },
            ],
        }),
    };
});

describe('Balances Component Examples', () => {
    let mockAppKit: any;
    let mockSendTransaction: any;

    const mockBoc = 'te6cckEBAQEAAgAAAEysuc0=';
    const mockNetwork = Network.mainnet();

    // Mock wallet
    const mockWallet = {
        getAddress: () => 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
        getNetwork: () => mockNetwork,
        sendTransaction: vi.fn(),
    };

    // Mock client
    const mockClient = {
        // Add methods if needed, but we mocked getJettonWalletAddressFromClient so maybe not needed
    };

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();

        mockSendTransaction = vi.fn().mockResolvedValue({ boc: mockBoc });
        mockWallet.sendTransaction = mockSendTransaction;

        mockAppKit = {
            connectors: [],
            walletsManager: {
                selectedWallet: mockWallet,
            },
            networkManager: {
                getClient: vi.fn().mockReturnValue(mockClient),
            },
            emitter: {
                on: vi.fn().mockReturnValue(() => {}),
                off: vi.fn(),
            },
        };
    });

    afterEach(() => {
        cleanup();
    });

    describe('SendTonButtonExample', () => {
        it('should render button', () => {
            render(<SendTonButtonExample />, { wrapper: createWrapper(mockAppKit) });
            // The text comes from i18n key 'balances.sendTon'. Check partially or assume default key
            // Since we didn't mock i18n, it might render the key or actual text if provider is set up correctly.
            // But SendTonButton passes `text` prop based on t().
            // Let's just check for specific elements or role
            expect(screen.getByRole('button')).toBeDefined();
        });

        it('should call sendTransaction with TON transfer params', async () => {
            render(<SendTonButtonExample />, { wrapper: createWrapper(mockAppKit) });

            const button = screen.getByRole('button');
            act(() => {
                button.click();
            });

            await waitFor(() => {
                expect(mockSendTransaction).toHaveBeenCalledWith(
                    expect.objectContaining({
                        messages: expect.arrayContaining([
                            expect.objectContaining({
                                amount: '1000000000',
                                address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
                            }),
                        ]),
                    }),
                );
            });
        });
    });

    describe('SendJettonButtonExample', () => {
        it('should render button', () => {
            render(<SendJettonButtonExample />, { wrapper: createWrapper(mockAppKit) });
            expect(screen.getByRole('button')).toBeDefined();
        });

        it('should call sendTransaction with Jetton transfer params', async () => {
            render(<SendJettonButtonExample />, { wrapper: createWrapper(mockAppKit) });

            const button = screen.getByRole('button');
            act(() => {
                button.click();
            });

            await waitFor(() => {
                // Check if it calls sendTransaction
                // The address should be the jetton wallet address we mocked
                expect(mockSendTransaction).toHaveBeenCalledWith(
                    expect.objectContaining({
                        messages: expect.arrayContaining([
                            expect.objectContaining({
                                address: 'kQD+XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX', // The mocked jetton wallet address
                            }),
                        ]),
                    }),
                );
            });
        });
    });
});
