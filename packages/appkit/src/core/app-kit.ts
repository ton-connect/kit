/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NetworkManager, Wallet as WalletInterface } from '@ton/walletkit';
import { Network, KitNetworkManager } from '@ton/walletkit';

import type { AppKit, AppKitConfig, WalletProvider } from '../types';
import type { EventBus } from './events';
import { createEventBus } from './events';

/**
 * Central hub for wallet management.
 * Stores eventBus, providers, and manages wallet connections.
 */
export class AppKitImpl implements AppKit {
    private networkManager!: NetworkManager;
    private _eventBus: EventBus;
    private _providers: WalletProvider[] = [];

    private constructor() {
        this._eventBus = createEventBus();
    }

    /**
     * Centralized event bus for wallet events
     */
    get eventBus(): EventBus {
        return this._eventBus;
    }

    /**
     * Registered wallet providers
     */
    get providers(): ReadonlyArray<WalletProvider> {
        return this._providers;
    }

    /**
     * Create a new AppKit instance
     */
    static create(config: AppKitConfig): AppKit {
        const appKit = new AppKitImpl();

        // Use provided networks config or default to mainnet
        const networks = config.networks ?? {
            [Network.mainnet().chainId]: {},
        };

        const networkManager = new KitNetworkManager({ networks });
        appKit.networkManager = networkManager;

        return appKit;
    }

    /**
     * Register a wallet provider
     */
    registerProvider(provider: WalletProvider): void {
        this._providers.push(provider);
        // Initialize provider with eventBus and networkManager
        provider.initialize(this._eventBus, this.networkManager);
    }

    /**
     * Get all connected wallets from all providers
     */
    async getConnectedWallets(): Promise<WalletInterface[]> {
        const allWallets: WalletInterface[] = [];
        for (const provider of this._providers) {
            const wallets = await provider.getConnectedWallets();
            allWallets.push(...wallets);
        }
        return allWallets;
    }

    /**
     * Connect wallet using specific provider
     */
    async connectWallet(providerId: string): Promise<void> {
        const provider = this._providers.find((p) => p.id === providerId);
        if (!provider) {
            throw new Error(`Provider with id "${providerId}" not found`);
        }
        await provider.connectWallet();
    }

    /**
     * Disconnect wallet using specific provider
     */
    async disconnectWallet(providerId: string): Promise<void> {
        const provider = this._providers.find((p) => p.id === providerId);
        if (!provider) {
            throw new Error(`Provider with id "${providerId}" not found`);
        }
        await provider.disconnectWallet();
    }
}

export function CreateAppKit(config: AppKitConfig): AppKit {
    return AppKitImpl.create(config);
}
