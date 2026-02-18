/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NetworkManager } from '@ton/walletkit';
import { Network, SwapManager } from '@ton/walletkit';
import type { Provider } from 'src/types/provider';

import type { AppKitConfig } from '../types/config';
import type { Connector, CreateConnectorFn } from '../../../types/connector';
import { Emitter } from '../../emitter';
import { CONNECTOR_EVENTS, WALLETS_EVENTS } from '../constants/events';
import type { AppKitEmitter, AppKitEvents } from '../types/events';
import type { WalletInterface } from '../../../types/wallet';
import { WalletsManager } from '../../wallets-manager';
import { AppKitNetworkManager } from './app-kit-network-manager';

/**
 * Central hub for wallet management.
 * Stores emitter, providers, and manages wallet connections.
 */
export class AppKit {
    readonly emitter: AppKitEmitter;
    readonly connectors: Connector[] = [];
    readonly walletsManager: WalletsManager;
    readonly swapManager: SwapManager;

    readonly networkManager: NetworkManager;
    readonly config: AppKitConfig;

    constructor(config: AppKitConfig) {
        this.config = config;

        this.emitter = new Emitter<AppKitEvents>();
        this.emitter.on(CONNECTOR_EVENTS.CONNECTED, this.updateWalletsFromConnectors.bind(this));
        this.emitter.on(CONNECTOR_EVENTS.DISCONNECTED, this.updateWalletsFromConnectors.bind(this));

        // Use provided networks config or default to mainnet
        const networks = config.networks ?? {
            [Network.mainnet().chainId]: {},
        };

        this.networkManager = new AppKitNetworkManager({ networks }, this.emitter);
        this.walletsManager = new WalletsManager(this.emitter);
        this.swapManager = new SwapManager();

        if (config.connectors) {
            config.connectors.forEach((connector) => {
                this.addConnector(connector);
            });
        }

        if (config.providers) {
            config.providers.forEach((provider) => {
                this.registerProvider(provider);
            });
        }
    }

    /**
     * Add a wallet connector
     */
    /**
     * Add a wallet connector
     */
    addConnector(createConnectorFn: CreateConnectorFn): () => void {
        const connector = createConnectorFn({ emitter: this.emitter, ssr: this.config.ssr });
        const id = connector.id;
        const oldConnector = this.connectors.find((c) => c.id === id);

        if (oldConnector) {
            this.removeConnector(oldConnector);
        }

        this.connectors.push(connector);

        return () => {
            this.removeConnector(connector);
        };
    }

    /**
     * Remove a wallet connector
     */
    removeConnector(connector: Connector): void {
        const id = connector.id;
        const oldConnector = this.connectors.find((c) => c.id === id);

        if (oldConnector) {
            oldConnector.destroy();
            this.connectors.splice(this.connectors.indexOf(oldConnector), 1);
        }
    }

    /**
     * Add a provider
     */
    registerProvider(provider: Provider): void {
        switch (provider.type) {
            case 'swap':
                this.swapManager.registerProvider(provider);
                break;
            default:
                throw new Error('Unknown provider type');
        }
    }

    /**
     * Get all connected wallets from all connectors
     */
    private updateWalletsFromConnectors(): void {
        const allWallets: WalletInterface[] = [];

        for (const connector of this.connectors.values()) {
            const wallets = connector.getConnectedWallets();
            allWallets.push(...wallets);
        }

        this.walletsManager.setWallets(allWallets);
        this.emitter.emit(WALLETS_EVENTS.UPDATED, { wallets: allWallets }, 'appkit');
    }
}
