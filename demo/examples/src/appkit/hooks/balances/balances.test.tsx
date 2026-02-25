/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import { render, screen, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { TokenAmount } from '@ton/walletkit';

import { createWrapper } from '../../../__tests__/test-utils';
import { UseBalanceExample } from './use-balance';
import { UseBalanceByAddressExample } from './use-balance-by-address';

describe('use-balance-by-address', () => {
    let mockAppKit: any;
    let mockGetBalance: any;

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();

        mockGetBalance = vi.fn();

        mockAppKit = {
            getDefaultNetwork: vi.fn(),
            connectors: [],
            networkManager: {
                getClient: vi.fn().mockReturnValue({
                    getBalance: mockGetBalance,
                }),
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

    it('should render loading state initially', async () => {
        // Return a promise that never resolves to simulate loading
        mockGetBalance.mockReturnValue(new Promise(() => {}));

        render(<UseBalanceByAddressExample />, {
            wrapper: createWrapper(mockAppKit),
        });

        expect(screen.getByText('Loading...')).toBeDefined();
    });

    it('should render balance when data is available', async () => {
        const mockBalance = {
            toString: () => '1000000000',
        } as TokenAmount;

        mockGetBalance.mockResolvedValue(mockBalance);

        render(<UseBalanceByAddressExample />, {
            wrapper: createWrapper(mockAppKit),
        });

        // Wait for loading to finish and balance to appear
        await waitFor(() => {
            expect(screen.getByText('Balance: 1')).toBeDefined();
        });
    });

    it('should render error message on failure', async () => {
        mockGetBalance.mockRejectedValue(new Error('Network error'));

        render(<UseBalanceByAddressExample />, {
            wrapper: createWrapper(mockAppKit),
        });

        await waitFor(() => {
            expect(screen.getByText('Error: Network error')).toBeDefined();
        });
    });
});

describe('use-balance', () => {
    let mockAppKit: any;
    let mockGetBalance: any;

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();

        mockGetBalance = vi.fn();

        const mockWallet = {
            getAddress: () => 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
        };

        mockAppKit = {
            getDefaultNetwork: vi.fn(),
            connectors: [],
            networkManager: {
                getClient: vi.fn().mockReturnValue({
                    getBalance: mockGetBalance,
                }),
            },
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

    it('should render loading state initially', async () => {
        // Return a promise that never resolves to simulate loading
        mockGetBalance.mockReturnValue(new Promise(() => {}));

        render(<UseBalanceExample />, {
            wrapper: createWrapper(mockAppKit),
        });

        // It might not show loading immediately if use-address is async or something,
        // but typically it should. Or if address is present, it starts fetching.
        // If address is missing, it might not fetch.
        // We mocked selectedWallet so address is present.

        expect(screen.getByText('Loading...')).toBeDefined();
    });

    it('should render balance when data is available', async () => {
        const mockBalance = {
            toString: () => '500000000',
        } as TokenAmount;

        mockGetBalance.mockResolvedValue(mockBalance);

        render(<UseBalanceExample />, {
            wrapper: createWrapper(mockAppKit),
        });

        await waitFor(() => {
            expect(screen.getByText('Balance: 0.5')).toBeDefined();
        });
    });

    it('should render error message on failure', async () => {
        mockGetBalance.mockRejectedValue(new Error('Failed to fetch balance'));

        render(<UseBalanceExample />, {
            wrapper: createWrapper(mockAppKit),
        });

        await waitFor(() => {
            expect(screen.getByText('Error: Failed to fetch balance')).toBeDefined();
        });
    });
});
