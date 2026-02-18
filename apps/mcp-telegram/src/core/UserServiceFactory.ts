/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * UserServiceFactory - Creates per-user McpWalletService instances
 *
 * Handles wallet management (create/import/list/remove) and creates
 * Wallet instances that are passed to McpWalletService.
 */

import {
    TonWalletKit,
    Signer,
    WalletV5R1Adapter,
    WalletV4R2Adapter,
    MemoryStorageAdapter,
    Network,
    createWalletId,
} from '@ton/walletkit';
import type { Wallet, ApiClientConfig } from '@ton/walletkit';
import { McpWalletService } from '@ton/mcp';

import type { ISignerAdapter, IStorageAdapter, WalletInfo } from '../adapters/index.js';
import { UserScopedSigner } from './UserScopedSigner.js';
import { UserScopedStorage } from './UserScopedStorage.js';

/**
 * Wallet info returned to callers (no sensitive data)
 */
export interface McpWalletInfo {
    name: string;
    address: string;
    network: 'mainnet' | 'testnet';
    version: 'v5r1' | 'v4r2';
    createdAt: string;
}

/**
 * Result of creating a wallet
 */
export interface CreateWalletResult {
    name: string;
    address: string;
    network: 'mainnet' | 'testnet';
}

/**
 * Result of importing a wallet
 */
export interface ImportWalletResult {
    name: string;
    address: string;
    network: 'mainnet' | 'testnet';
}

export interface UserServiceFactoryConfig {
    signer: ISignerAdapter;
    storage: IStorageAdapter;
    defaultNetwork?: 'mainnet' | 'testnet';
    networks?: {
        mainnet?: { apiKey?: string };
        testnet?: { apiKey?: string };
    };
}

/**
 * Per-user context with wallet management and service
 */
interface UserContext {
    userSigner: UserScopedSigner;
    userStorage: UserScopedStorage;
    service: McpWalletService | null;
    loadedWallet: Wallet | null;
    currentWalletName: string | null;
}

/**
 * Creates and caches per-user McpWalletService instances.
 * Handles wallet management operations.
 */
export class UserServiceFactory {
    private readonly signer: ISignerAdapter;
    private readonly storage: IStorageAdapter;
    private readonly defaultNetwork: 'mainnet' | 'testnet';
    private readonly networks?: {
        mainnet?: { apiKey?: string };
        testnet?: { apiKey?: string };
    };
    private readonly userContexts = new Map<string, UserContext>();
    private kit: TonWalletKit | null = null;

    constructor(config: UserServiceFactoryConfig) {
        this.signer = config.signer;
        this.storage = config.storage;
        this.defaultNetwork = config.defaultNetwork ?? 'mainnet';
        this.networks = config.networks;
    }

    /**
     * Initialize TonWalletKit
     */
    private async getKit(): Promise<TonWalletKit> {
        if (!this.kit) {
            const mainnetConfig: ApiClientConfig = {};
            const testnetConfig: ApiClientConfig = {};

            if (this.networks?.mainnet?.apiKey) {
                mainnetConfig.url = 'https://toncenter.com';
                mainnetConfig.key = this.networks.mainnet.apiKey;
            }
            if (this.networks?.testnet?.apiKey) {
                testnetConfig.url = 'https://testnet.toncenter.com';
                testnetConfig.key = this.networks.testnet.apiKey;
            }

            this.kit = new TonWalletKit({
                networks: {
                    [Network.mainnet().chainId]: { apiClient: mainnetConfig },
                    [Network.testnet().chainId]: { apiClient: testnetConfig },
                },
                storage: new MemoryStorageAdapter(),
            });
            await this.kit.waitForReady();
        }
        return this.kit;
    }

    /**
     * Get Network instance from network name
     */
    private getNetwork(networkName: 'mainnet' | 'testnet'): Network {
        return networkName === 'mainnet' ? Network.mainnet() : Network.testnet();
    }

    /**
     * Get or create user context
     */
    private getUserContext(userId: string): UserContext {
        let context = this.userContexts.get(userId);
        if (!context) {
            context = {
                userSigner: new UserScopedSigner(this.signer, userId),
                userStorage: new UserScopedStorage(this.storage, userId),
                service: null,
                loadedWallet: null,
                currentWalletName: null,
            };
            this.userContexts.set(userId, context);
        }
        return context;
    }

    /**
     * Load a wallet for operations
     */
    private async loadWallet(userId: string, walletName: string): Promise<Wallet> {
        const context = this.getUserContext(userId);
        const walletInfo = await context.userSigner.getWallet(walletName);
        if (!walletInfo) {
            throw new Error('Wallet not found');
        }

        const network = this.getNetwork(walletInfo.network);
        const walletId = createWalletId(network, walletInfo.address);
        const kit = await this.getKit();

        // Check if already loaded in kit
        let wallet = kit.getWallet(walletId);
        if (wallet) {
            return wallet;
        }

        // Get stored wallet data from signer
        const signer = context.userSigner.getUnderlyingSigner() as {
            getStoredWallet?(walletId: string):
                | {
                      mnemonic: string[];
                      version: 'v5r1' | 'v4r2';
                  }
                | undefined;
        };

        if (typeof signer.getStoredWallet !== 'function') {
            throw new Error('Signer does not support wallet loading');
        }

        // Get the scoped wallet ID
        const scopedWalletId = `${userId}:${walletName}`;
        const storedWallet = signer.getStoredWallet(scopedWalletId);
        if (!storedWallet) {
            throw new Error('Wallet data not found');
        }

        const signerInstance = await Signer.fromMnemonic(storedWallet.mnemonic, { type: 'ton' });

        const walletAdapter =
            storedWallet.version === 'v5r1'
                ? await WalletV5R1Adapter.create(signerInstance, {
                      client: kit.getApiClient(network),
                      network,
                  })
                : await WalletV4R2Adapter.create(signerInstance, {
                      client: kit.getApiClient(network),
                      network,
                  });

        wallet = await kit.addWallet(walletAdapter);
        if (!wallet) {
            wallet = kit.getWallet(walletId);
        }
        if (!wallet) {
            throw new Error('Failed to load wallet');
        }

        return wallet;
    }

    /**
     * Get or create a McpWalletService for a specific user and wallet.
     */
    async getService(userId: string, walletName: string): Promise<McpWalletService> {
        const context = this.getUserContext(userId);

        // If we already have a service for this wallet, return it
        if (context.service && context.currentWalletName === walletName) {
            return context.service;
        }

        // Close existing service if switching wallets
        if (context.service) {
            await context.service.close();
        }

        // Load the wallet
        const wallet = await this.loadWallet(userId, walletName);

        // Create new service
        context.service = await McpWalletService.create({
            wallet,
            networks: this.networks,
        });
        context.loadedWallet = wallet;
        context.currentWalletName = walletName;

        return context.service;
    }

    // ===========================================
    // Wallet Management Methods
    // ===========================================

    /**
     * Create a new wallet for a user
     */
    async createWallet(
        userId: string,
        name: string,
        version: 'v5r1' | 'v4r2' = 'v5r1',
        networkName: 'mainnet' | 'testnet' = this.defaultNetwork,
    ): Promise<CreateWalletResult> {
        const context = this.getUserContext(userId);

        const walletInfo = await context.userSigner.createWallet({
            walletId: name,
            version,
            network: networkName,
        });

        // Store metadata
        const metadata: McpWalletInfo = {
            name,
            address: walletInfo.address,
            network: walletInfo.network,
            version: walletInfo.version,
            createdAt: walletInfo.createdAt,
        };
        await context.userStorage.set(`wallet:${name}`, metadata);

        return {
            name,
            address: walletInfo.address,
            network: walletInfo.network,
        };
    }

    /**
     * Import a wallet from mnemonic for a user
     */
    async importWallet(
        userId: string,
        name: string,
        mnemonic: string[],
        version: 'v5r1' | 'v4r2' = 'v5r1',
        networkName: 'mainnet' | 'testnet' = this.defaultNetwork,
    ): Promise<ImportWalletResult> {
        const context = this.getUserContext(userId);

        const walletInfo = await context.userSigner.importWallet({
            walletId: name,
            mnemonic,
            version,
            network: networkName,
        });

        // Store metadata
        const metadata: McpWalletInfo = {
            name,
            address: walletInfo.address,
            network: walletInfo.network,
            version: walletInfo.version,
            createdAt: walletInfo.createdAt,
        };
        await context.userStorage.set(`wallet:${name}`, metadata);

        return {
            name,
            address: walletInfo.address,
            network: walletInfo.network,
        };
    }

    /**
     * List all wallets for a user
     */
    async listWallets(userId: string): Promise<McpWalletInfo[]> {
        const context = this.getUserContext(userId);
        const walletIds = await context.userSigner.listWalletIds();
        const wallets: McpWalletInfo[] = [];

        for (const walletId of walletIds) {
            const wallet = await context.userSigner.getWallet(walletId);
            if (wallet) {
                wallets.push({
                    name: walletId,
                    address: wallet.address,
                    network: wallet.network,
                    version: wallet.version,
                    createdAt: wallet.createdAt,
                });
            }
        }

        return wallets;
    }

    /**
     * Remove a wallet for a user
     */
    async removeWallet(userId: string, name: string): Promise<boolean> {
        const context = this.getUserContext(userId);

        // Close service if this is the current wallet
        if (context.currentWalletName === name && context.service) {
            await context.service.close();
            context.service = null;
            context.loadedWallet = null;
            context.currentWalletName = null;
        }

        const deleted = await context.userSigner.deleteWallet(name);
        if (deleted) {
            await context.userStorage.delete(`wallet:${name}`);
        }
        return deleted;
    }

    /**
     * Get wallet info for a user
     */
    async getWallet(userId: string, name: string): Promise<WalletInfo | null> {
        const context = this.getUserContext(userId);
        return context.userSigner.getWallet(name);
    }

    /**
     * Close all cached services.
     */
    async closeAll(): Promise<void> {
        for (const context of this.userContexts.values()) {
            if (context.service) {
                await context.service.close();
            }
        }
        this.userContexts.clear();

        if (this.kit) {
            await this.kit.close();
            this.kit = null;
        }
    }
}
