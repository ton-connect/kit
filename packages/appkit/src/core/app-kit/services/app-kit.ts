/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NetworkManager } from '@ton/walletkit';
import { Network, KitNetworkManager } from '@ton/walletkit';

import type { AppKitConfig } from '../types/config';
import type { Connector } from '../../../types/connector';
import { Emitter } from '../../events';
import { Cache } from '../../cache';
import { CONNECTOR_EVENTS, WALLETS_EVENTS } from '../constants/events';
import type { AppKitEmitter, AppKitEvents } from '../types/events';
import type { WalletInterface } from '../../../features/wallets';
import { WalletsManager } from '../../../features/wallets';

/**
 * Central hub for wallet management.
 * Stores emitter, providers, and manages wallet connections.
 */
export class AppKit {
    readonly emitter: AppKitEmitter;
    readonly connectors: Map<string, Connector> = new Map();
    readonly walletsManager: WalletsManager;

    readonly networkManager: NetworkManager;
    readonly config: AppKitConfig;
    public readonly cache: Cache;

    constructor(config: AppKitConfig) {
        this.config = config;
        this.cache = new Cache({
            storage: window.localStorage,
        });

        // Use provided networks config or default to mainnet
        const networks = config.networks ?? {
            [Network.mainnet().chainId]: {},
        };

        this.networkManager = new KitNetworkManager({ networks });

        this.emitter = new Emitter<AppKitEvents>();
        this.emitter.on(CONNECTOR_EVENTS.CONNECTED, this.updateWalletsFromConnectors.bind(this));
        this.emitter.on(CONNECTOR_EVENTS.DISCONNECTED, this.updateWalletsFromConnectors.bind(this));

        this.walletsManager = new WalletsManager(this.emitter);
    }

    /**
     * Add a wallet connector
     */
    addConnector(connector: Connector): () => void {
        const id = connector.id;

        if (this.connectors.has(id)) {
            const oldConnector = this.connectors.get(id);
            oldConnector?.destroy();
        }

        this.connectors.set(id, connector);
        connector.initialize(this.emitter, this.networkManager);

        return () => this.removeConnector(id);
    }

    /**
     * Remove a wallet connector
     */
    removeConnector(connectorId: string): void {
        const connector = this.connectors.get(connectorId);

        if (!connector) {
            throw new Error(`Connector with id "${connectorId}" not found`);
        }

        connector.destroy();
        this.connectors.delete(connectorId);
    }

    /**
     * Get wallets from wallets manager
     */
    getConnectedWallets(): readonly WalletInterface[] {
        return this.walletsManager.wallets;
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
