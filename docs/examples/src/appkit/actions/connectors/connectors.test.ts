/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AppKit } from '@ton/appkit';
import { Network } from '@ton/walletkit';
import type { Connector } from '@ton/appkit';
import { CONNECTOR_EVENTS } from '@ton/appkit';

import { connectExample } from './connect';
import { disconnectExample } from './disconnect';
import { getConnectorsExample } from './get-connectors';
import { getConnectorByIdExample } from './get-connector-by-id';
import { watchConnectorsExample } from './watch-connectors';
import { watchConnectorByIdExample } from './watch-connector-by-id';

describe('Connector Actions Examples (Integration)', () => {
    let appKit: AppKit;
    let consoleSpy: ReturnType<typeof vi.spyOn>;
    let mockConnector: Connector;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        // Initialize real AppKit
        appKit = new AppKit({
            networks: {
                [Network.mainnet().chainId]: {},
            },
        });

        // Mock Connector
        mockConnector = {
            id: 'tonconnect',
            type: 'injected',
            metadata: {
                name: 'TonConnect',
            },
            connectWallet: vi.fn(),
            disconnectWallet: vi.fn(),
            getConnectedWallets: vi.fn().mockReturnValue([]),
            initialize: vi.fn(),
            destroy: vi.fn(),
        } as unknown as Connector;

        // Add connector to AppKit
        appKit.addConnector(() => mockConnector);
    });

    afterEach(() => {
        consoleSpy.mockRestore();
    });

    describe('getConnectorsExample', () => {
        it('should get and log available connectors', () => {
            getConnectorsExample(appKit);
            expect(consoleSpy).toHaveBeenCalledWith('Connector:', 'tonconnect');
        });
    });

    describe('getConnectorByIdExample', () => {
        it('should get and log specific connector', () => {
            getConnectorByIdExample(appKit);
            expect(consoleSpy).toHaveBeenCalledWith('Found connector:', 'tonconnect');
        });
    });

    describe('connectExample', () => {
        it('should call connectWallet on the connector', async () => {
            await connectExample(appKit);
            expect(mockConnector.connectWallet).toHaveBeenCalled();
            // Example does not log
            // expect(consoleSpy).toHaveBeenCalledWith('Connect initiated');
        });
    });

    describe('disconnectExample', () => {
        it('should call disconnectWallet on the connector', async () => {
            await disconnectExample(appKit);
            expect(mockConnector.disconnectWallet).toHaveBeenCalled();
            // Example does not log
            // expect(consoleSpy).toHaveBeenCalledWith('Disconnect initiated');
        });
    });

    describe('watchConnectorsExample', () => {
        it('should log updated connectors on event', () => {
            watchConnectorsExample(appKit);

            // Trigger event
            appKit.emitter.emit(
                CONNECTOR_EVENTS.CONNECTED,
                {
                    wallets: [],
                    connectorId: 'test',
                },
                'test',
            );

            expect(consoleSpy).toHaveBeenCalledWith('Connectors updated:', expect.arrayContaining([mockConnector]));
        });
    });

    describe('watchConnectorByIdExample', () => {
        it('should log updated connector on event', () => {
            watchConnectorByIdExample(appKit);

            // Trigger event
            appKit.emitter.emit(
                CONNECTOR_EVENTS.CONNECTED,
                {
                    wallets: [],
                    connectorId: 'test',
                },
                'test',
            );

            expect(consoleSpy).toHaveBeenCalledWith('Connector updated:', mockConnector);
        });
    });
});
