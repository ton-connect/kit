/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { TonConnectUI } from '@tonconnect/ui';
import type { TonConnectUiCreateOptions } from '@tonconnect/ui';

import { TonConnectWalletAdapter } from '../adapters/ton-connect-wallet-adapter';
import { CONNECTOR_EVENTS } from '../../../core/app-kit';
import type { Connector, ConnectorMetadata } from '../../../types/connector';
import type { WalletInterface } from '../../../types/wallet';
import type { AppKitEmitter } from '../../../core/app-kit';
import { TONCONNECT_DEFAULT_CONNECTOR_ID } from '../constants/id';

export interface TonConnectConnectorConfig {
    id?: string;
    metadata?: ConnectorMetadata;
    tonConnectOptions?: TonConnectUiCreateOptions;
    tonConnectUI?: TonConnectUI;
}

export class TonConnectConnector implements Connector {
    readonly id: string;
    readonly type = 'tonconnect';
    readonly metadata: ConnectorMetadata;
    readonly tonConnectUI: TonConnectUI;

    private emitter: AppKitEmitter | null = null;
    private unsubscribeTonConnect: (() => void) | null = null;

    constructor(config: TonConnectConnectorConfig) {
        if (config.tonConnectOptions && config.tonConnectUI) {
            // eslint-disable-next-line no-console
            console.warn(
                'TonConnectConnector: both tonConnectOptions and tonConnectUI are provided, using tonConnectUI',
            );
        }

        this.id = config.id ?? TONCONNECT_DEFAULT_CONNECTOR_ID;
        this.tonConnectUI = config?.tonConnectUI ?? new TonConnectUI(config.tonConnectOptions);
        this.metadata = {
            name: 'TonConnect',
            iconUrl: 'https://avatars.githubusercontent.com/u/113980577',
            ...config.metadata,
        };
    }

    async initialize(emitter: AppKitEmitter): Promise<void> {
        this.emitter = emitter;

        // Subscribe to TonConnect status changes
        this.unsubscribeTonConnect = this.tonConnectUI.onStatusChange((wallet) => {
            const wallets = this.getConnectedWallets();

            if (wallet) {
                this.emitter?.emit(CONNECTOR_EVENTS.CONNECTED, { wallets, connectorId: this.id }, this.id);
            } else {
                this.emitter?.emit(CONNECTOR_EVENTS.DISCONNECTED, { connectorId: this.id }, this.id);
            }
        });

        // Restore existing connection
        await this.tonConnectUI.connector.restoreConnection();
    }

    destroy(): void {
        this.unsubscribeTonConnect?.();
        this.unsubscribeTonConnect = null;
        this.emitter = null;
    }

    async connectWallet(): Promise<void> {
        await this.tonConnectUI.openModal();
    }

    async disconnectWallet(): Promise<void> {
        await this.tonConnectUI.disconnect();
    }

    getConnectedWallets(): WalletInterface[] {
        if (this.tonConnectUI.connected && this.tonConnectUI.wallet) {
            const wallet = this.tonConnectUI.wallet;

            const walletAdapter = new TonConnectWalletAdapter({
                connectorId: this.id,
                tonConnectWallet: wallet,
                tonConnectUI: this.tonConnectUI,
            });

            return [walletAdapter];
        }

        return [];
    }
}
