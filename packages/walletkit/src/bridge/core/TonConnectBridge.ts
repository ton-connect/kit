/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ConnectRequest } from '@tonconnect/protocol';

import type { BridgeConfig } from './BridgeConfig';
import type { Transport } from '../transport/Transport';
import type { WalletId } from '../../utils';

/**
 * Core TonConnect JS Bridge implementation
 * Implements the TonConnect protocol specification
 * Uses dependency injection for transport layer
 */
export class TonConnectBridge {
    // Public properties as per TonConnect spec
    public readonly deviceInfo: BridgeConfig['deviceInfo'];
    public readonly walletInfo: BridgeConfig['walletInfo'];
    public readonly protocolVersion: number;
    public readonly isWalletBrowser: boolean;
    public readonly walletId?: WalletId;

    // Private state
    private readonly transport: Transport;
    private readonly eventListeners: Array<(event: unknown) => void> = [];

    constructor(config: BridgeConfig, transport: Transport) {
        this.deviceInfo = config.deviceInfo;
        this.walletInfo = config.walletInfo;
        this.protocolVersion = config.protocolVersion;
        this.isWalletBrowser = config.isWalletBrowser;
        this.walletId = config.walletId;

        this.transport = transport;

        // Setup event forwarding from transport
        this.transport.onEvent((event) => {
            this.notifyListeners(event);
        });
    }

    /**
     * Initiates connect request - forwards to transport
     */
    async connect(protocolVersion: number, message: ConnectRequest): Promise<unknown> {
        if (protocolVersion < 2) {
            throw new Error('Unsupported protocol version');
        }

        return this.transport.send({
            method: 'connect',
            params: { protocolVersion, ...message },
        });
    }

    /**
     * Attempts to restore previous connection - forwards to transport
     */
    async restoreConnection(): Promise<unknown> {
        return this.transport.send({
            method: 'restoreConnection',
            params: [],
        });
    }

    /**
     * Sends a message to the bridge - forwards to transport
     */
    async send(message: unknown): Promise<unknown> {
        return this.transport.send({
            method: 'send',
            params: [message],
        });
    }

    /**
     * Registers a listener for events from the wallet
     * Returns unsubscribe function
     */
    listen(callback: (event: unknown) => void): () => void {
        if (typeof callback !== 'function') {
            throw new Error('Callback must be a function');
        }

        this.eventListeners.push(callback);

        // Return unsubscribe function
        return () => {
            const index = this.eventListeners.indexOf(callback);
            if (index > -1) {
                this.eventListeners.splice(index, 1);
            }
        };
    }

    /**
     * Expose listener count for environments that need to fan-out events across frames.
     */
    public hasListeners(): boolean {
        return this.eventListeners.length > 0;
    }

    /**
     * Notify all registered listeners of an event
     */
    private notifyListeners(event: unknown): void {
        this.eventListeners.forEach((callback) => {
            try {
                callback(event);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('TonConnect event listener error:', error);
            }
        });
    }

    /**
     * Check if transport is available
     */
    isTransportAvailable(): boolean {
        return this.transport.isAvailable();
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        this.eventListeners.length = 0;
        this.transport.destroy();
    }
}
