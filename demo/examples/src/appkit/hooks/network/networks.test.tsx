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
import { NETWORKS_EVENTS } from '@ton/appkit';

import { createWrapper } from '../../../__tests__/test-utils';
import { UseNetworkExample } from './use-network';
import { UseNetworksExample } from './use-networks';

describe('Network Hooks Examples', () => {
    let mockAppKit: any;
    let mockEmitter: any;

    const mockNetworkMainnet = Network.mainnet();
    const mockNetworkTestnet = Network.testnet();

    const mockWallet = {
        getAddress: () => 'EQaddress1',
        getNetwork: () => mockNetworkMainnet,
        connectorId: 'mock-connector',
    };

    beforeEach(() => {
        cleanup();
        vi.clearAllMocks();

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

        mockAppKit = {
            connectors: [],
            networkManager: {
                getConfiguredNetworks: vi.fn().mockReturnValue([mockNetworkMainnet, mockNetworkTestnet]),
            },
            walletsManager: {
                selectedWallet: null,
            },
            emitter: mockEmitter,
        };
    });

    afterEach(() => {
        cleanup();
    });

    describe('UseNetworkExample', () => {
        it('should render "Network not selected" initially', () => {
            render(<UseNetworkExample />, { wrapper: createWrapper(mockAppKit) });
            expect(screen.getByText('Network not selected')).toBeDefined();
        });

        it('should render current network chainId', () => {
            mockAppKit.walletsManager.selectedWallet = mockWallet;
            render(<UseNetworkExample />, { wrapper: createWrapper(mockAppKit) });
            expect(screen.getByText(`Current Network: ${mockNetworkMainnet.chainId}`)).toBeDefined();
        });
    });

    describe('UseNetworksExample', () => {
        it('should render list of available networks', () => {
            render(<UseNetworksExample />, { wrapper: createWrapper(mockAppKit) });
            expect(screen.getByText(`${mockNetworkMainnet.chainId}`)).toBeDefined();
            expect(screen.getByText(`${mockNetworkTestnet.chainId}`)).toBeDefined();
        });

        it('should update list when networks change', async () => {
            render(<UseNetworksExample />, { wrapper: createWrapper(mockAppKit) });

            expect(screen.getByText(`${mockNetworkMainnet.chainId}`)).toBeDefined();

            const newNetworks = [mockNetworkMainnet]; // Removed testnet
            mockAppKit.networkManager.getConfiguredNetworks.mockReturnValue(newNetworks);

            act(() => {
                mockEmitter.emit(NETWORKS_EVENTS.UPDATED);
            });

            await waitFor(() => {
                expect(screen.queryByText(`${mockNetworkTestnet.chainId}`)).toBeNull();
                expect(screen.getByText(`${mockNetworkMainnet.chainId}`)).toBeDefined();
            });
        });
    });
});
