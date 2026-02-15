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
import { WALLETS_EVENTS } from '@ton/appkit';

import { createWrapper } from '../../../../src/__tests__/test-utils';
import { UseSelectedWalletExample } from './use-selected-wallet';
import { UseConnectedWalletsExample } from './use-connected-wallets';
import { UseConnectorsExample } from './use-connectors';
import { UseConnectorByIdExample } from './use-connector-by-id';
import { UseConnectExample } from './use-connect';
import { UseDisconnectExample } from './use-disconnect';
import { UseAddressExample } from './use-address';

describe('Wallet Hooks Examples', () => {
    let mockAppKit: any;
    let mockConnect: any;
    let mockDisconnect: any;
    let mockEmitter: any;

    const mockWallet = {
        getAddress: () => 'EQaddress1',
        getNetwork: () => Network.mainnet(),
        connectorId: 'mock-connector',
    };

    const mockWallet2 = {
        getAddress: () => 'EQaddress2',
        getNetwork: () => Network.mainnet(),
        connectorId: 'mock-connector-2',
    };

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();

        mockConnect = vi.fn().mockResolvedValue(undefined);
        mockDisconnect = vi.fn().mockResolvedValue(undefined);

        const listeners: Record<string, ((...args: any[]) => void)[]> = {};

        mockEmitter = {
            on: vi.fn((event, callback) => {
                if (!listeners[event]) listeners[event] = [];
                listeners[event].push(callback);
                return () => {
                    listeners[event] = listeners[event].filter((cb) => cb !== callback);
                };
            }),
            off: vi.fn(),
            emit: (event: string, ...args: any[]) => {
                if (listeners[event]) {
                    listeners[event].forEach((cb) => cb(...args));
                }
            },
        };

        const mockConnector = {
            id: 'mock-connector',
            type: 'Mock Connector',
            connectWallet: mockConnect,
            disconnectWallet: mockDisconnect,
            getConnectedWallets: () => [],
        };

        const mockConnector2 = {
            id: 'mock-connector-2',
            type: 'Mock Connector 2',
            connectWallet: mockConnect,
            disconnectWallet: mockDisconnect,
            getConnectedWallets: () => [],
        };

        const mockInjectedConnector = {
            id: 'injected',
            type: 'Injected',
            connectWallet: mockConnect,
            disconnectWallet: mockDisconnect,
            getConnectedWallets: () => [],
        };

        const mockTonConnectConnector = {
            id: 'tonconnect',
            type: 'TonConnect',
            connectWallet: mockConnect,
            disconnectWallet: mockDisconnect,
            getConnectedWallets: () => [],
        };

        mockAppKit = {
            connectors: [mockConnector, mockConnector2, mockInjectedConnector, mockTonConnectConnector],
            walletsManager: {
                selectedWallet: null,
                wallets: [],
                setWallets: vi.fn(),
            },
            emitter: mockEmitter,
            networkManager: {
                getClient: vi.fn(),
            },
        };
    });

    afterEach(() => {
        cleanup();
    });

    describe('UseSelectedWalletExample', () => {
        it('should render "No wallet selected" initially', () => {
            render(<UseSelectedWalletExample />, { wrapper: createWrapper(mockAppKit) });
            expect(screen.getByText('No wallet selected')).toBeDefined();
        });

        it('should render selected wallet address', () => {
            mockAppKit.walletsManager.selectedWallet = mockWallet;
            render(<UseSelectedWalletExample />, { wrapper: createWrapper(mockAppKit) });
            expect(screen.getByText('Current Wallet: EQaddress1')).toBeDefined();
        });

        it('should update when selection changes', async () => {
            render(<UseSelectedWalletExample />, { wrapper: createWrapper(mockAppKit) });
            expect(screen.getByText('No wallet selected')).toBeDefined();

            act(() => {
                mockAppKit.walletsManager.selectedWallet = mockWallet;
                mockEmitter.emit(WALLETS_EVENTS.SELECTION_CHANGED, mockWallet);
            });

            await waitFor(() => {
                expect(screen.getByText('Current Wallet: EQaddress1')).toBeDefined();
            });
        });
    });

    describe('UseConnectedWalletsExample', () => {
        it('should display connected wallets list', () => {
            mockAppKit.walletsManager.wallets = [mockWallet, mockWallet2];
            render(<UseConnectedWalletsExample />, { wrapper: createWrapper(mockAppKit) });
            expect(screen.getByText((content) => content.includes('EQaddress1'))).toBeDefined();
            expect(screen.getByText((content) => content.includes('EQaddress2'))).toBeDefined();
        });
    });

    describe('UseConnectorsExample', () => {
        it('should display available connectors', () => {
            render(<UseConnectorsExample />, { wrapper: createWrapper(mockAppKit) });
            expect(screen.getByText('Mock Connector')).toBeDefined();
            expect(screen.getByText('Mock Connector 2')).toBeDefined();
        });

        it('should trigger connect on click', async () => {
            render(<UseConnectorsExample />, { wrapper: createWrapper(mockAppKit) });

            const button = screen.getAllByRole('button')[0];
            act(() => {
                button.click();
            });

            await waitFor(() => {
                expect(mockConnect).toHaveBeenCalled();
            });
        });
    });

    describe('UseConnectorByIdExample', () => {
        it('should display found connector details', () => {
            render(<UseConnectorByIdExample />, { wrapper: createWrapper(mockAppKit) });
            expect(screen.getByText('ID: injected')).toBeDefined();
            expect(screen.getByText('Type: Injected')).toBeDefined();
        });
    });

    describe('UseConnectExample', () => {
        it('should show connect button when no wallet selected', () => {
            render(<UseConnectExample />, { wrapper: createWrapper(mockAppKit) });
            expect(screen.getByRole('button', { name: 'Connect Wallet' })).toBeDefined();
        });

        it('should trigger connect on click', async () => {
            render(<UseConnectExample />, { wrapper: createWrapper(mockAppKit) });

            const button = screen.getByRole('button', { name: 'Connect Wallet' });
            act(() => {
                button.click();
            });

            await waitFor(() => {
                expect(mockConnect).toHaveBeenCalled();
            });
        });

        it('should show disconnect button when wallet selected', () => {
            mockAppKit.walletsManager.selectedWallet = mockWallet;
            render(<UseConnectExample />, { wrapper: createWrapper(mockAppKit) });
            expect(screen.getByRole('button', { name: 'Disconnect' })).toBeDefined();
        });
    });

    describe('UseDisconnectExample', () => {
        it('should show "Wallet not connected" if no wallet', () => {
            render(<UseDisconnectExample />, { wrapper: createWrapper(mockAppKit) });
            expect(screen.getByText('Wallet not connected')).toBeDefined();
        });

        it('should trigger disconnect on click', async () => {
            mockAppKit.walletsManager.selectedWallet = mockWallet;
            render(<UseDisconnectExample />, { wrapper: createWrapper(mockAppKit) });

            const button = screen.getByRole('button', { name: 'Disconnect' });
            act(() => {
                button.click();
            });

            await waitFor(() => {
                expect(mockDisconnect).toHaveBeenCalled();
            });
        });
    });

    describe('UseAddressExample', () => {
        it('should render address of selected wallet', () => {
            mockAppKit.walletsManager.selectedWallet = mockWallet;
            render(<UseAddressExample />, { wrapper: createWrapper(mockAppKit) });
            expect(screen.getByText('Current Address: EQaddress1')).toBeDefined();
        });

        it('should render "Wallet not connected" if no wallet selected', () => {
            render(<UseAddressExample />, { wrapper: createWrapper(mockAppKit) });
            expect(screen.getByText('Wallet not connected')).toBeDefined();
        });
    });
});
