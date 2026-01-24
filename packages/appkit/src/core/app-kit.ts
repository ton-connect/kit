/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NetworkManager } from '@ton/walletkit';
import { Network, KitNetworkManager } from '@ton/walletkit';

import type { AppKitConfig } from './types';
import type { WalletProvider } from '../types/wallet-provider';
import { EventBus, PROVIDER_EVENTS, WALLETS_EVENTS } from '../features/events';
import type { WalletInterface } from '../types/wallet';
import { WalletsManager } from '../features/wallets-manager';

/**
 * Central hub for wallet management.
 * Stores eventBus, providers, and manages wallet connections.
 */
export class AppKit {
    readonly eventBus: EventBus;
    readonly walletsManager: WalletsManager;

    private networkManager: NetworkManager;
    private providers: Map<string, WalletProvider> = new Map();

    constructor(config: AppKitConfig) {
        // Use provided networks config or default to mainnet
        const networks = config.networks ?? {
            [Network.mainnet().chainId]: {},
        };

        this.networkManager = new KitNetworkManager({ networks });
        this.walletsManager = new WalletsManager();

        this.eventBus = new EventBus();
        this.eventBus.on(PROVIDER_EVENTS.CONNECTED, this.updateWalletsFromProviders.bind(this));
        this.eventBus.on(PROVIDER_EVENTS.DISCONNECTED, this.updateWalletsFromProviders.bind(this));
    }

    /**
     * Register a wallet provider
     */
    registerProvider(provider: WalletProvider): () => void {
        const id = provider.id;

        if (this.providers.has(id)) {
            const oldProvider = this.providers.get(id);
            oldProvider?.destroy();
        }

        this.providers.set(id, provider);
        provider.initialize(this.eventBus, this.networkManager);

        return () => this.unregisterProvider(id);
    }

    /**
     * Unregister a wallet provider
     */
    unregisterProvider(providerId: string): void {
        const provider = this.providers.get(providerId);

        if (!provider) {
            throw new Error(`Provider with id "${providerId}" not found`);
        }

        provider.destroy();
        this.providers.delete(providerId);
    }

    /**
     * Get wallets from wallets manager
     */
    getConnectedWallets(): readonly WalletInterface[] {
        return this.walletsManager.wallets;
    }

    /**
     * Connect wallet using specific provider
     */
    async connectWallet(providerId: string): Promise<void> {
        const provider = this.providers.get(providerId);

        if (!provider) {
            throw new Error(`Provider with id "${providerId}" not found`);
        }

        await provider.connectWallet();
    }

    /**
     * Disconnect wallet using specific provider
     */
    async disconnectWallet(providerId: string): Promise<void> {
        const provider = this.providers.get(providerId);

        if (!provider) {
            throw new Error(`Provider with id "${providerId}" not found`);
        }

        await provider.disconnectWallet();
    }

    /**
     * Get all connected wallets from all providers
     */
    private updateWalletsFromProviders(): void {
        const allWallets: WalletInterface[] = [];

        for (const provider of this.providers.values()) {
            const wallets = provider.getConnectedWallets();
            allWallets.push(...wallets);
        }

        this.walletsManager.setWallets(allWallets);
        this.eventBus.emit(WALLETS_EVENTS.UPDATED, { wallets: allWallets }, 'appkit');
    }
}
