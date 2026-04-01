/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { SwapProviderInterface, ProviderInput, StakingProviderInterface } from '@ton/walletkit';
import { SwapManager, StakingManager } from '@ton/walletkit';

import type { AppKitConfig } from '../types/config';
import type { Connector, ConnectorFactoryContext, ConnectorInput } from '../../../types/connector';
import { Emitter } from '../../emitter';
import { CONNECTOR_EVENTS, WALLETS_EVENTS } from '../constants/events';
import type { AppKitEmitter, AppKitEvents } from '../types/events';
import type { WalletInterface } from '../../../types/wallet';
import { WalletsManager } from '../../wallets-manager';
import { AppKitNetworkManager } from '../../network';
import { Network } from '../../../types/network';

/**
 * Central hub for wallet management.
 * Stores emitter, providers, and manages wallet connections.
 */
export class AppKit {
    readonly emitter: AppKitEmitter;
    readonly connectors: Connector[] = [];
    readonly walletsManager: WalletsManager;
    readonly swapManager: SwapManager;
    readonly stakingManager: StakingManager;

    readonly networkManager: AppKitNetworkManager;
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
        this.swapManager = new SwapManager(() => this.createFactoryContext());
        this.stakingManager = new StakingManager(() => this.createFactoryContext());

        if (config.connectors) {
            config.connectors.forEach((input) => {
                this.addConnector(input);
            });
        }

        if (config.providers) {
            config.providers.forEach((input) => {
                this.registerProvider(input);
            });
        }
    }

    createFactoryContext(): ConnectorFactoryContext {
        return { emitter: this?.emitter, networkManager: this?.networkManager, ssr: this?.config?.ssr };
    }
    /**
     * Add a wallet connector
     */
    addConnector(input: ConnectorInput): () => void {
        const connector = typeof input === 'function' ? input(this.createFactoryContext()) : input;
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
    registerProvider(input: ProviderInput): void {
        const provider = typeof input === 'function' ? input(this.createFactoryContext()) : input;
        switch (provider.type) {
            case 'swap':
                this.swapManager.registerProvider(provider as SwapProviderInterface);
                break;
            case 'staking':
                this.stakingManager.registerProvider(provider as StakingProviderInterface);
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
