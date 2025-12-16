/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Wallet management with validation and persistence

import type { Storage } from '../storage';
import { validateWallet } from '../validation';
import { globalLogger } from './Logger';
import type { WalletId } from '../utils/walletId';
import { createWalletId } from '../utils/walletId';
import type { Network } from '../api/models';
import type { Wallet, WalletAdapter } from '../api/interfaces';

const _log = globalLogger.createChild('WalletManager');

export class WalletManager {
    private wallets: Map<WalletId, Wallet> = new Map();
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
    getWallets(): Wallet[] {
        return Array.from(this.wallets.values());
    }

    /**
     * Get wallet by wallet ID (network:address format)
     */
    getWallet(walletId: WalletId): Wallet | undefined {
        return this.wallets.get(walletId) || undefined;
    }

    /**
     * Get wallet by address and network (convenience method)
     */
    getWalletByAddressAndNetwork(address: string, network: Network): Wallet | undefined {
        const walletId = createWalletId(network, address);
        return this.getWallet(walletId);
    }

    /**
     * Add a wallet with validation
     */
    async addWallet(wallet: Wallet): Promise<WalletId> {
        const validation = validateWallet(wallet);
        if (!validation.isValid) {
            throw new Error(`Invalid wallet: ${validation.errors.join(', ')}`);
        }

        const walletId = createWalletId(wallet.getNetwork(), wallet.getAddress());
        if (this.wallets.has(walletId)) {
            return walletId;
        }

        this.wallets.set(walletId, wallet);
        return walletId;
    }

    /**
     * Remove wallet by wallet ID or wallet adapter
     */
    async removeWallet(walletIdOrAdapter: WalletId | WalletAdapter): Promise<boolean> {
        let walletId: WalletId;
        if (typeof walletIdOrAdapter === 'string') {
            walletId = walletIdOrAdapter;
        } else {
            walletId = createWalletId(walletIdOrAdapter.getNetwork(), walletIdOrAdapter.getAddress());
        }

        const removed = this.wallets.delete(walletId);
        return removed;
    }

    /**
     * Update existing wallet
     */
    async updateWallet(wallet: Wallet): Promise<void> {
        const walletId = createWalletId(wallet.getNetwork(), wallet.getAddress());
        if (!this.wallets.has(walletId)) {
            throw new Error(`Wallet with ID ${walletId} not found`);
        }

        const validation = validateWallet(wallet);
        if (!validation.isValid) {
            throw new Error(`Invalid wallet: ${validation.errors.join(', ')}`);
        }

        this.wallets.set(walletId, wallet);
    }

    /**
     * Clear all wallets
     */
    async clearWallets(): Promise<void> {
        this.wallets.clear();
    }

    /**
     * Get wallet count
     */
    getWalletCount(): number {
        return this.wallets.size;
    }

    /**
     * Check if wallet exists by wallet ID
     */
    hasWallet(walletId: WalletId): boolean {
        return this.wallets.has(walletId);
    }

    /**
     * Get wallet ID for a wallet adapter
     */
    getWalletId(wallet: WalletAdapter): WalletId {
        return createWalletId(wallet.getNetwork(), wallet.getAddress());
    }
}
