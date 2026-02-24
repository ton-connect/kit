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

import { createWrapper } from '../../../__tests__/test-utils';
import { UseSignBinaryExample } from './use-sign-binary';
import { UseSignCellExample } from './use-sign-cell';
import { UseSignTextExample } from './use-sign-text';

describe('Signing Hooks Examples', () => {
    let mockAppKit: any;
    let mockSignData: any;

    const mockSignature = 'mock-signature-base64';

    const mockWallet = {
        getAddress: () => 'EQaddress1',
        signData: vi.fn(),
    };

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();

        mockSignData = vi.fn().mockResolvedValue({ signature: mockSignature });
        mockWallet.signData = mockSignData;

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

    describe('UseSignBinaryExample', () => {
        it('should render sign button initially', () => {
            render(<UseSignBinaryExample />, { wrapper: createWrapper(mockAppKit) });
            expect(screen.getByText('Sign Binary')).toBeDefined();
        });

        it('should call signBinary on button click', async () => {
            render(<UseSignBinaryExample />, { wrapper: createWrapper(mockAppKit) });

            const button = screen.getByText('Sign Binary');
            act(() => {
                button.click();
            });

            await waitFor(() => {
                expect(mockSignData).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: expect.objectContaining({
                            type: 'binary',
                            value: { content: 'SGVsbG8=' },
                        }),
                    }),
                );
            });
        });

        it('should display signature on success', async () => {
            render(<UseSignBinaryExample />, { wrapper: createWrapper(mockAppKit) });

            const button = screen.getByText('Sign Binary');
            act(() => {
                button.click();
            });

            await waitFor(() => {
                expect(screen.getByText(mockSignature)).toBeDefined();
            });
        });

        it('should display error on failure', async () => {
            mockSignData.mockRejectedValue(new Error('User rejected'));
            render(<UseSignBinaryExample />, { wrapper: createWrapper(mockAppKit) });

            const button = screen.getByText('Sign Binary');
            act(() => {
                button.click();
            });

            await waitFor(() => {
                expect(screen.getByText('Error: User rejected')).toBeDefined();
            });
        });
    });

    describe('UseSignCellExample', () => {
        it('should render sign button initially', () => {
            render(<UseSignCellExample />, { wrapper: createWrapper(mockAppKit) });
            expect(screen.getByText('Sign Cell')).toBeDefined();
        });

        it('should call signCell on button click', async () => {
            render(<UseSignCellExample />, { wrapper: createWrapper(mockAppKit) });

            const button = screen.getByText('Sign Cell');
            act(() => {
                button.click();
            });

            await waitFor(() => {
                expect(mockSignData).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: expect.objectContaining({
                            type: 'cell',
                            // value content check might be specific to implementation details
                        }),
                    }),
                );
            });
        });

        it('should display signature on success', async () => {
            render(<UseSignCellExample />, { wrapper: createWrapper(mockAppKit) });

            const button = screen.getByText('Sign Cell');
            act(() => {
                button.click();
            });

            await waitFor(() => {
                expect(screen.getByText(mockSignature)).toBeDefined();
            });
        });
    });

    describe('UseSignTextExample', () => {
        it('should render sign button initially', () => {
            render(<UseSignTextExample />, { wrapper: createWrapper(mockAppKit) });
            expect(screen.getByText('Sign Text')).toBeDefined();
        });

        it('should call signText on button click', async () => {
            render(<UseSignTextExample />, { wrapper: createWrapper(mockAppKit) });

            const button = screen.getByText('Sign Text');
            act(() => {
                button.click();
            });

            await waitFor(() => {
                expect(mockSignData).toHaveBeenCalledWith(
                    expect.objectContaining({
                        data: expect.objectContaining({
                            type: 'text',
                            value: { content: 'Hello, TON!' },
                        }),
                    }),
                );
            });
        });

        it('should display signature on success', async () => {
            render(<UseSignTextExample />, { wrapper: createWrapper(mockAppKit) });

            const button = screen.getByText('Sign Text');
            act(() => {
                button.click();
            });

            await waitFor(() => {
                expect(screen.getByText(mockSignature)).toBeDefined();
            });
        });
    });
});
