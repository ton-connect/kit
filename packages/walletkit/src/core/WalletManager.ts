/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Wallet management with validation and persistence

import type { IWallet } from '../types';
import { Storage } from '../storage';
import { IWalletAdapter } from '../types/wallet';
import { validateWallet } from '../validation';
import { globalLogger } from './Logger';

const log = globalLogger.createChild('WalletManager');

export class WalletManager {
    private wallets: Map<string, IWallet> = new Map();
    private storage: Storage;
    // private storageKey = 'wallets';

    constructor(storage: Storage) {
        this.storage = storage;
    }

    /**
     * Initialize manager and load persisted wallets
     */
    async initialize(): Promise<void> {
        // await this.loadWallets();
    }

    /**
     * Get all wallets as array
     */
    getWallets(): IWallet[] {
        return Array.from(this.wallets.values());
    }

    /**
     * Get wallet by public key
     */
    getWallet(address: string): IWallet | undefined {
        return this.wallets.get(address) || undefined;
    }

    /**
     * Add a wallet with validation
     */
    async addWallet(wallet: IWallet): Promise<boolean> {
        const validation = validateWallet(wallet);
        if (!validation.isValid) {
            throw new Error(`Invalid wallet: ${validation.errors.join(', ')}`);
        }

        if (this.wallets.has(wallet.getAddress())) {
            return true;
        }

        this.wallets.set(wallet.getAddress(), wallet);
        return true;
    }

    /**
     * Remove wallet by public key
     */
    async removeWallet(addressOrWallet: string | IWalletAdapter): Promise<boolean> {
        const address = typeof addressOrWallet === 'string' ? addressOrWallet : addressOrWallet.getAddress();

        const removed = this.wallets.delete(address);
        // if (removed) {
        //     await this.persistWallets();
        // }

        return removed;
    }

    /**
     * Update existing wallet
     */
    async updateWallet(wallet: IWallet): Promise<void> {
        if (!this.wallets.has(wallet.getAddress())) {
            throw new Error(`Wallet with address ${wallet.getAddress()} not found`);
        }

        const validation = validateWallet(wallet);
        if (!validation.isValid) {
            throw new Error(`Invalid wallet: ${validation.errors.join(', ')}`);
        }

        this.wallets.set(wallet.getAddress(), wallet);
        // await this.persistWallets();
    }

    /**
     * Clear all wallets
     */
    async clearWallets(): Promise<void> {
        this.wallets.clear();
        // await this.persistWallets();
    }

    /**
     * Find wallet by address (async since getAddress is async)
     */
    async findWalletByAddress(address: string): Promise<IWallet | null> {
        for (const wallet of this.wallets.values()) {
            try {
                const walletAddress = wallet.getAddress();
                if (walletAddress === address) {
                    return wallet;
                }
            } catch (error) {
                log.warn('Failed to get address for wallet', { publicKey: wallet.publicKey, error });
            }
        }
        return null;
    }

    /**
     * Get wallet count
     */
    getWalletCount(): number {
        return this.wallets.size;
    }

    /**
     * Check if wallet exists
     */
    hasWallet(publicKey: string): boolean {
        return this.wallets.has(publicKey);
    }

    /**
     * Load wallets from storage
     */
    // private async loadWallets(): Promise<void> {
    //     try {
    //         // Note: We can't persist actual WalletInterface instances since they contain functions
    //         // This is a placeholder for wallet metadata storage
    //         // In practice, you'd store wallet identifiers and reconstruct WalletInterface instances
    //         // eslint-disable-next-line @typescript-eslint/no-explicit-any
    //         const walletData = await this.storageAdapter.get<any[]>(this.storageKey);

    //         if (walletData && Array.isArray(walletData)) {
    //             // TODO: Implement wallet reconstruction from stored metadata
    //             logger.debug('Loaded wallet metadata', { count: walletData.length });
    //         }
    //     } catch (error) {
    //         logger.warn('Failed to load wallets from storage', { error });
    //     }
    // }

    /**
     * Persist wallet metadata to storage
     */
    // private async persistWallets(): Promise<void> {
    //     try {
    //         // Store wallet metadata (not the actual functions)
    //         const walletMetadata = this.getWallets().map((wallet) => ({
    //             publicKey: wallet.publicKey,
    //             version: wallet.version,
    //             // Add other serializable properties as needed
    //         }));

    //         await this.storageAdapter.set(this.storageKey, walletMetadata);
    //     } catch (error) {
    //         logger.warn('Failed to persist wallets to storage', { error });
    //     }
    // }
}
