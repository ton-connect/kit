/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Secure storage for wallet data with encryption-ready interface.
 * Currently uses plaintext storage, designed for easy encryption addition.
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';

export interface WalletData {
    name: string;
    address: string;
    mnemonic: string[];
    network: 'mainnet' | 'testnet';
    version: 'v5r1' | 'v4r2';
    createdAt: string;
}

export interface StorageFile {
    version: number;
    wallets: WalletData[];
}

/**
 * Storage provider interface - allows swapping plaintext for encrypted storage
 */
export interface StorageProvider {
    save(data: StorageFile): Promise<void>;
    load(): Promise<StorageFile>;
}

/**
 * Plaintext storage provider - stores data as JSON
 * TODO: Replace with EncryptedStorageProvider for production use
 */
export class PlaintextStorageProvider implements StorageProvider {
    private filePath: string;

    constructor(filePath: string) {
        this.filePath = filePath;
    }

    async save(data: StorageFile): Promise<void> {
        const dir = path.dirname(this.filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        await fs.promises.writeFile(this.filePath, JSON.stringify(data, null, 2), 'utf-8');
    }

    async load(): Promise<StorageFile> {
        if (!fs.existsSync(this.filePath)) {
            return { version: 1, wallets: [] };
        }
        const content = await fs.promises.readFile(this.filePath, 'utf-8');
        return JSON.parse(content) as StorageFile;
    }
}

/**
 * SecureStorage class - manages wallet data with pluggable storage providers
 */
export class SecureStorage {
    private provider: StorageProvider;
    private cache: StorageFile | null = null;

    constructor(provider?: StorageProvider) {
        const defaultPath = path.join(os.homedir(), '.ton-mcp', 'wallets.json');
        this.provider = provider ?? new PlaintextStorageProvider(defaultPath);
    }

    /**
     * Get all stored wallets
     */
    async getWallets(): Promise<WalletData[]> {
        const data = await this.loadData();
        return data.wallets;
    }

    /**
     * Get a wallet by name
     */
    async getWallet(name: string): Promise<WalletData | undefined> {
        const wallets = await this.getWallets();
        return wallets.find((w) => w.name === name);
    }

    /**
     * Get a wallet by address
     */
    async getWalletByAddress(address: string): Promise<WalletData | undefined> {
        const wallets = await this.getWallets();
        return wallets.find((w) => w.address === address);
    }

    /**
     * Get wallet ID (network:address format, matching @ton/walletkit pattern)
     */
    getWalletId(wallet: WalletData): string {
        return `${wallet.network}:${wallet.address}`;
    }

    /**
     * Add a new wallet
     */
    async addWallet(wallet: WalletData): Promise<void> {
        const data = await this.loadData();
        const walletId = this.getWalletId(wallet);

        // Check for duplicate name
        if (data.wallets.some((w) => w.name === wallet.name)) {
            throw new Error(`Wallet with name "${wallet.name}" already exists`);
        }

        // Check for duplicate walletId (same address on same network)
        if (data.wallets.some((w) => this.getWalletId(w) === walletId)) {
            throw new Error(`Wallet with address "${wallet.address}" already exists on ${wallet.network}`);
        }

        data.wallets.push(wallet);
        await this.saveData(data);
    }

    /**
     * Remove a wallet by name
     */
    async removeWallet(name: string): Promise<boolean> {
        const data = await this.loadData();
        const index = data.wallets.findIndex((w) => w.name === name);

        if (index === -1) {
            return false;
        }

        data.wallets.splice(index, 1);
        await this.saveData(data);
        return true;
    }

    /**
     * Update a wallet
     */
    async updateWallet(name: string, updates: Partial<Omit<WalletData, 'name'>>): Promise<boolean> {
        const data = await this.loadData();
        const wallet = data.wallets.find((w) => w.name === name);

        if (!wallet) {
            return false;
        }

        Object.assign(wallet, updates);
        await this.saveData(data);
        return true;
    }

    /**
     * Clear all wallets
     */
    async clearAll(): Promise<void> {
        await this.saveData({ version: 1, wallets: [] });
    }

    private async loadData(): Promise<StorageFile> {
        if (!this.cache) {
            this.cache = await this.provider.load();
        }
        return this.cache;
    }

    private async saveData(data: StorageFile): Promise<void> {
        this.cache = data;
        await this.provider.save(data);
    }
}
