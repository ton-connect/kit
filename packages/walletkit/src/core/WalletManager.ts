// Wallet management with validation and persistence

import type { WalletInterface } from '../types';
import type { StorageAdapter } from '../types/internal';
import { validateWallet } from '../validation';
import { globalLogger } from './Logger';

const log = globalLogger.createChild('WalletManager');

export class WalletManager {
    private wallets: Map<string, WalletInterface> = new Map();
    private storageAdapter: StorageAdapter;
    // private storageKey = 'wallets';

    constructor(storageAdapter: StorageAdapter) {
        this.storageAdapter = storageAdapter;
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
    getWallets(): WalletInterface[] {
        return Array.from(this.wallets.values());
    }

    /**
     * Get wallet by public key
     */
    getWallet(address: string): WalletInterface | undefined {
        return this.wallets.get(address) || undefined;
    }

    /**
     * Add a wallet with validation
     */
    async addWallet(wallet: WalletInterface): Promise<boolean> {
        const validation = validateWallet(wallet);
        if (!validation.isValid) {
            throw new Error(`Invalid wallet: ${validation.errors.join(', ')}`);
        }

        if (this.wallets.has(wallet.getAddress())) {
            log.info(`Wallet with address ${wallet.getAddress()} already exists`);
            return false;
        }

        this.wallets.set(wallet.getAddress(), wallet);
        return true;
    }

    /**
     * Remove wallet by public key
     */
    async removeWallet(addressOrWallet: string | WalletInterface): Promise<boolean> {
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
    async updateWallet(wallet: WalletInterface): Promise<void> {
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
    async findWalletByAddress(address: string): Promise<WalletInterface | null> {
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
