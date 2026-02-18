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
import { UseSendTransactionExample } from './use-send-transaction';
import { UseTransferTonExample } from './use-transfer-ton';

describe('Transaction Hooks Examples', () => {
    let mockAppKit: any;
    let mockSendTransaction: any;

    const mockBoc = 'te6cckEBAQEAAgAAAEysuc0=';
    const mockNetwork = Network.mainnet();

    const mockWallet = {
        getAddress: () => 'EQaddress1',
        getNetwork: () => mockNetwork,
        sendTransaction: vi.fn(),
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
            emitter: {
                on: vi.fn().mockReturnValue(() => {}),
                off: vi.fn(),
            },
        };
    });

    afterEach(() => {
        cleanup();
    });

    describe('UseSendTransactionExample', () => {
        it('should render send button initially', () => {
            render(<UseSendTransactionExample />, { wrapper: createWrapper(mockAppKit) });
            expect(screen.getByText('Send Transaction')).toBeDefined();
        });

        it('should call sendTransaction on button click', async () => {
            render(<UseSendTransactionExample />, { wrapper: createWrapper(mockAppKit) });

            const button = screen.getByText('Send Transaction');
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

        it('should display BOC on success', async () => {
            render(<UseSendTransactionExample />, { wrapper: createWrapper(mockAppKit) });

            const button = screen.getByText('Send Transaction');
            act(() => {
                button.click();
            });

            await waitFor(() => {
                expect(screen.getByText(`BOC: ${mockBoc}`)).toBeDefined();
            });
        });

        it('should display error on failure', async () => {
            mockSendTransaction.mockRejectedValue(new Error('Transaction rejected'));
            render(<UseSendTransactionExample />, { wrapper: createWrapper(mockAppKit) });

            const button = screen.getByText('Send Transaction');
            act(() => {
                button.click();
            });

            await waitFor(() => {
                expect(screen.getByText('Error: Transaction rejected')).toBeDefined();
            });
        });
    });

    describe('UseTransferTonExample', () => {
        it('should render transfer button initially', () => {
            render(<UseTransferTonExample />, { wrapper: createWrapper(mockAppKit) });
            expect(screen.getByText('Transfer TON')).toBeDefined();
        });

        it('should call transferTon (which calls sendTransaction) on button click', async () => {
            render(<UseTransferTonExample />, { wrapper: createWrapper(mockAppKit) });

            const button = screen.getByText('Transfer TON');
            act(() => {
                button.click();
            });

            await waitFor(() => {
                // The helper creates a transaction object which is then passed to sendTransaction of the wallet
                expect(mockSendTransaction).toHaveBeenCalledWith(
                    expect.objectContaining({
                        messages: expect.arrayContaining([
                            expect.objectContaining({
                                amount: '1000000000',
                                address: 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
                                // We know comment "Hello from AppKit!" generates a specific payload, checking existence
                                payload: expect.any(String),
                            }),
                        ]),
                        fromAddress: 'EQaddress1',
                    }),
                );
            });
        });

        it('should display BOC on success', async () => {
            render(<UseTransferTonExample />, { wrapper: createWrapper(mockAppKit) });

            const button = screen.getByText('Transfer TON');
            act(() => {
                button.click();
            });

            await waitFor(() => {
                expect(screen.getByText(`BOC: ${mockBoc}`)).toBeDefined();
            });
        });
    });
});
