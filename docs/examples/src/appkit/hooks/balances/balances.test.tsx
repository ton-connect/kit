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
import { Network } from '@ton/walletkit';
import type { TokenAmount } from '@ton/walletkit';

import { createWrapper } from '../../../__tests__/test-utils';
import { UseBalanceExample } from './use-balance';
import { UseBalanceByAddressExample } from './use-balance-by-address';
import { UseWatchBalanceExample } from './use-watch-balance';
import { UseWatchBalanceByAddressExample } from './use-watch-balance-by-address';

describe('use-balance-by-address', () => {
    let mockAppKit: any;
    let mockGetBalance: any;

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();

        mockGetBalance = vi.fn();

        const mockWallet = {
            getAddress: () => 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
            getNetwork: () => 'mainnet',
        };

        mockAppKit = {
            getDefaultNetwork: vi.fn(),
            connectors: [],
            networkManager: {
                getClient: vi.fn().mockReturnValue({
                    getBalance: mockGetBalance,
                }),
            },
            streamingManager: {
                hasProvider: vi.fn().mockReturnValue(false),
                watchBalance: vi.fn().mockReturnValue(() => {}),
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
            getNetwork: () => 'mainnet',
        };

        mockAppKit = {
            getDefaultNetwork: vi.fn(),
            connectors: [],
            networkManager: {
                getClient: vi.fn().mockReturnValue({
                    getBalance: mockGetBalance,
                }),
            },
            streamingManager: {
                hasProvider: vi.fn().mockReturnValue(false),
                watchBalance: vi.fn().mockReturnValue(() => {}),
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

describe('use-watch-balance-by-address', () => {
    let mockAppKit: any;

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();

        mockAppKit = {
            connectors: [],
            walletsManager: {
                selectedWallet: {
                    getAddress: () => 'UQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAJKZ',
                    getNetwork: () => Network.mainnet(),
                },
            },
            networkManager: {
                getClient: vi.fn().mockReturnValue({
                    getBalance: vi.fn().mockResolvedValue({ toString: () => '0' }),
                }),
            },
            streamingManager: {
                hasProvider: vi.fn().mockReturnValue(true),
                watchBalance: vi.fn().mockReturnValue(() => {}),
            },
            emitter: {
                on: vi.fn().mockReturnValue(() => {}),
                off: vi.fn(),
            },
        };
    });

    it('should start watching balance', async () => {
        render(<UseWatchBalanceByAddressExample />, {
            wrapper: createWrapper(mockAppKit),
        });

        await waitFor(() => {
            expect(mockAppKit.streamingManager.watchBalance).toHaveBeenCalled();
        });
        expect(screen.getByText(/Current balance:/)).toBeDefined();
    });
});

describe('use-watch-balance', () => {
    let mockAppKit: any;
    let mockGetBalance: any;

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();

        mockGetBalance = vi.fn().mockResolvedValue({ toString: () => '0' });

        const mockWallet = {
            getAddress: () => 'EQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAM9c',
            getNetwork: () => Network.mainnet(),
        };

        mockAppKit = {
            connectors: [],
            walletsManager: {
                selectedWallet: mockWallet,
            },
            networkManager: {
                getClient: vi.fn().mockReturnValue({
                    getBalance: mockGetBalance,
                }),
            },
            streamingManager: {
                hasProvider: vi.fn().mockReturnValue(true),
                watchBalance: vi.fn().mockReturnValue(() => {}),
            },
            emitter: {
                on: vi.fn().mockReturnValue(() => {}),
                off: vi.fn(),
            },
        };
    });

    it('should start watching balance for the selected wallet', () => {
        render(<UseWatchBalanceExample />, {
            wrapper: createWrapper(mockAppKit),
        });

        expect(mockAppKit.streamingManager.watchBalance).toHaveBeenCalled();
        expect(screen.getByText(/Current balance:/)).toBeDefined();
    });
});
