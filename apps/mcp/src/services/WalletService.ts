/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * WalletService - Core wallet operations using TonWalletKit
 */

import {
    TonWalletKit,
    Signer,
    WalletV5R1Adapter,
    WalletV4R2Adapter,
    CreateTonMnemonic,
    MemoryStorageAdapter,
    Network,
    createWalletId,
} from '@ton/walletkit';
import type { Wallet } from '@ton/walletkit';

import { SecureStorage } from '../storage/SecureStorage.js';
import type { WalletData } from '../storage/SecureStorage.js';

export interface CreateWalletResult {
    name: string;
    address: string;
    mnemonic: string[];
    network: 'mainnet' | 'testnet';
}

export interface ImportWalletResult {
    name: string;
    address: string;
    network: 'mainnet' | 'testnet';
}

export interface WalletInfo {
    name: string;
    address: string;
    network: 'mainnet' | 'testnet';
    version: 'v5r1' | 'v4r2';
    createdAt: string;
}

export interface JettonInfoResult {
    address: string;
    balance: string;
    name?: string;
    symbol?: string;
    decimals?: number;
}

export interface TransferResult {
    success: boolean;
    message: string;
}

/**
 * WalletService manages TON wallets using TonWalletKit
 */
export class WalletService {
    private storage: SecureStorage;
    private kit: TonWalletKit | null = null;
    private network: Network;
    private networkName: 'mainnet' | 'testnet';
    private loadedWallets: Map<string, Wallet> = new Map();

    constructor(network: 'mainnet' | 'testnet' = 'mainnet') {
        this.storage = new SecureStorage();
        this.networkName = network;
        this.network = network === 'mainnet' ? Network.mainnet() : Network.testnet();
    }

    /**
     * Initialize the TonWalletKit instance
     */
    private async getKit(): Promise<TonWalletKit> {
        if (!this.kit) {
            this.kit = new TonWalletKit({
                networks: {
                    [this.network.chainId]: {},
                },
                storage: new MemoryStorageAdapter(),
            });
            await this.kit.waitForReady();
        }
        return this.kit;
    }

    /**
     * Create a new wallet with generated mnemonic
     */
    async createWallet(name: string, version: 'v5r1' | 'v4r2' = 'v5r1'): Promise<CreateWalletResult> {
        const kit = await this.getKit();

        // Generate new mnemonic
        const mnemonic = await CreateTonMnemonic();

        // Create signer from mnemonic
        const signer = await Signer.fromMnemonic(mnemonic, { type: 'ton' });

        // Create wallet adapter based on version
        const walletAdapter =
            version === 'v5r1'
                ? await WalletV5R1Adapter.create(signer, {
                      client: kit.getApiClient(this.network),
                      network: this.network,
                  })
                : await WalletV4R2Adapter.create(signer, {
                      client: kit.getApiClient(this.network),
                      network: this.network,
                  });

        const address = walletAdapter.getAddress();

        // Store wallet data
        const walletData: WalletData = {
            name,
            address,
            mnemonic,
            network: this.networkName,
            version,
            createdAt: new Date().toISOString(),
        };

        await this.storage.addWallet(walletData);

        // Add to kit and cache
        const wallet = await kit.addWallet(walletAdapter);
        if (wallet) {
            this.loadedWallets.set(address, wallet);
        }

        return {
            name,
            address,
            mnemonic,
            network: walletData.network,
        };
    }

    /**
     * Import a wallet from mnemonic
     */
    async importWallet(
        name: string,
        mnemonic: string[],
        version: 'v5r1' | 'v4r2' = 'v5r1',
    ): Promise<ImportWalletResult> {
        const kit = await this.getKit();

        // Create signer from mnemonic
        const signer = await Signer.fromMnemonic(mnemonic, { type: 'ton' });

        // Create wallet adapter based on version
        const walletAdapter =
            version === 'v5r1'
                ? await WalletV5R1Adapter.create(signer, {
                      client: kit.getApiClient(this.network),
                      network: this.network,
                  })
                : await WalletV4R2Adapter.create(signer, {
                      client: kit.getApiClient(this.network),
                      network: this.network,
                  });

        const address = walletAdapter.getAddress();

        // Store wallet data
        const walletData: WalletData = {
            name,
            address,
            mnemonic,
            network: this.networkName,
            version,
            createdAt: new Date().toISOString(),
        };

        await this.storage.addWallet(walletData);

        // Add to kit and cache
        const wallet = await kit.addWallet(walletAdapter);
        if (wallet) {
            this.loadedWallets.set(address, wallet);
        }

        return {
            name,
            address,
            network: walletData.network,
        };
    }

    /**
     * List all stored wallets
     */
    async listWallets(): Promise<WalletInfo[]> {
        const wallets = await this.storage.getWallets();
        return wallets.map((w) => ({
            name: w.name,
            address: w.address,
            network: w.network,
            version: w.version,
            createdAt: w.createdAt,
        }));
    }

    /**
     * Remove a wallet by name
     */
    async removeWallet(name: string): Promise<boolean> {
        const walletData = await this.storage.getWallet(name);
        if (!walletData) {
            return false;
        }

        // Remove from cache
        this.loadedWallets.delete(walletData.address);

        // Remove from kit if loaded
        if (this.kit) {
            const walletId = createWalletId(this.network, walletData.address);
            const kitWallet = this.kit.getWallet(walletId);
            if (kitWallet) {
                await this.kit.removeWallet(walletId);
            }
        }

        return this.storage.removeWallet(name);
    }

    /**
     * Get or load a wallet by name
     */
    private async getWalletByName(name: string): Promise<Wallet> {
        const walletData = await this.storage.getWallet(name);
        if (!walletData) {
            throw new Error(`Wallet "${name}" not found`);
        }

        // Check cache first
        if (this.loadedWallets.has(walletData.address)) {
            return this.loadedWallets.get(walletData.address)!;
        }

        // Load wallet into kit
        const kit = await this.getKit();
        const signer = await Signer.fromMnemonic(walletData.mnemonic, { type: 'ton' });

        const walletAdapter =
            walletData.version === 'v5r1'
                ? await WalletV5R1Adapter.create(signer, {
                      client: kit.getApiClient(this.network),
                      network: this.network,
                  })
                : await WalletV4R2Adapter.create(signer, {
                      client: kit.getApiClient(this.network),
                      network: this.network,
                  });

        const wallet = await kit.addWallet(walletAdapter);
        if (!wallet) {
            // Wallet already exists in kit
            const walletId = createWalletId(this.network, walletData.address);
            const existingWallet = kit.getWallet(walletId);
            if (existingWallet) {
                this.loadedWallets.set(walletData.address, existingWallet);
                return existingWallet;
            }
            throw new Error(`Failed to load wallet "${name}"`);
        }

        this.loadedWallets.set(walletData.address, wallet);
        return wallet;
    }

    /**
     * Get TON balance for a wallet
     */
    async getBalance(walletName: string): Promise<string> {
        const wallet = await this.getWalletByName(walletName);
        const balance = await wallet.getBalance();
        return balance;
    }

    /**
     * Get Jetton balance for a wallet
     */
    async getJettonBalance(walletName: string, jettonAddress: string): Promise<string> {
        const wallet = await this.getWalletByName(walletName);
        const balance = await wallet.getJettonBalance(jettonAddress);
        return balance;
    }

    /**
     * Get all Jettons for a wallet
     */
    async getJettons(walletName: string): Promise<JettonInfoResult[]> {
        const wallet = await this.getWalletByName(walletName);
        const jettonsResponse = await wallet.getJettons({ pagination: { limit: 100, offset: 0 } });

        const results: JettonInfoResult[] = [];

        for (const j of jettonsResponse.jettons) {
            results.push({
                address: j.address,
                balance: j.balance,
                name: j.info.name,
                symbol: j.info.symbol,
                decimals: j.decimalsNumber,
            });
        }

        return results;
    }

    /**
     * Send TON to an address
     */
    async sendTon(walletName: string, toAddress: string, amount: string, comment?: string): Promise<TransferResult> {
        try {
            const wallet = await this.getWalletByName(walletName);

            const tx = await wallet.createTransferTonTransaction({
                recipientAddress: toAddress,
                transferAmount: amount,
                comment,
            });

            await wallet.sendTransaction(tx);

            return {
                success: true,
                message: `Successfully sent ${amount} nanoTON to ${toAddress}`,
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Send Jetton to an address
     */
    async sendJetton(
        walletName: string,
        toAddress: string,
        jettonAddress: string,
        amount: string,
        comment?: string,
    ): Promise<TransferResult> {
        try {
            const wallet = await this.getWalletByName(walletName);

            const tx = await wallet.createTransferJettonTransaction({
                recipientAddress: toAddress,
                jettonAddress,
                transferAmount: amount,
                comment,
            });

            await wallet.sendTransaction(tx);

            return {
                success: true,
                message: `Successfully sent ${amount} jettons to ${toAddress}`,
            };
        } catch (error) {
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }

    /**
     * Close the service and cleanup
     */
    async close(): Promise<void> {
        if (this.kit) {
            await this.kit.close();
            this.kit = null;
        }
        this.loadedWallets.clear();
    }
}
