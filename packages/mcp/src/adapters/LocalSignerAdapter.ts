/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * LocalSignerAdapter - Local signer using @ton/walletkit
 *
 * This adapter uses TonWalletKit for wallet operations.
 * For production use with encryption, extend this class or implement
 * your own ISignerAdapter with proper key encryption.
 *
 * Note: This is a reference implementation. For production custody,
 * consider using HSM, KMS, or Vault-based signers.
 */

import {
    TonWalletKit,
    Signer,
    WalletV5R1Adapter,
    WalletV4R2Adapter,
    CreateTonMnemonic,
    MemoryStorageAdapter,
    Network,
} from '@ton/walletkit';
import type { Wallet } from '@ton/walletkit';

import type { ISignerAdapter, WalletInfo, CreateWalletParams, ImportWalletParams } from '../types/signer.js';

/**
 * Internal wallet data stored by the adapter
 */
interface StoredWallet {
    walletId: string;
    mnemonic: string[];
    publicKey: string;
    address: string;
    network: 'mainnet' | 'testnet';
    version: 'v5r1' | 'v4r2';
    createdAt: string;
}

/**
 * Local signer adapter using TonWalletKit.
 *
 * This implementation stores mnemonics in memory. For production use,
 * implement encryption or use a secure key management system.
 */
export class LocalSignerAdapter implements ISignerAdapter {
    private wallets: Map<string, StoredWallet> = new Map();
    private kit: TonWalletKit | null = null;
    private loadedWallets: Map<string, Wallet> = new Map();

    /**
     * Get Network instance from network name
     */
    private getNetwork(networkName: 'mainnet' | 'testnet'): Network {
        return networkName === 'mainnet' ? Network.mainnet() : Network.testnet();
    }

    /**
     * Initialize or get TonWalletKit instance
     */
    private async getKit(): Promise<TonWalletKit> {
        if (!this.kit) {
            this.kit = new TonWalletKit({
                networks: {
                    [Network.mainnet().chainId]: {},
                    [Network.testnet().chainId]: {},
                },
                storage: new MemoryStorageAdapter(),
            });
            await this.kit.waitForReady();
        }
        return this.kit;
    }

    /**
     * Create wallet adapter from mnemonic
     */
    private async createWalletAdapter(
        mnemonic: string[],
        version: 'v5r1' | 'v4r2',
        network: Network,
    ): Promise<{ adapter: WalletV5R1Adapter | WalletV4R2Adapter; publicKey: string }> {
        const kit = await this.getKit();
        const signer = await Signer.fromMnemonic(mnemonic, { type: 'ton' });

        const adapter =
            version === 'v5r1'
                ? await WalletV5R1Adapter.create(signer, {
                      client: kit.getApiClient(network),
                      network,
                  })
                : await WalletV4R2Adapter.create(signer, {
                      client: kit.getApiClient(network),
                      network,
                  });

        // Get public key from signer
        const publicKey = Buffer.from(signer.publicKey).toString('hex');

        return { adapter, publicKey };
    }

    /**
     * Create a new wallet with generated mnemonic
     */
    async createWallet(params: CreateWalletParams): Promise<WalletInfo> {
        const { walletId, version, network: networkName } = params;

        // Check if wallet already exists
        if (this.wallets.has(walletId)) {
            throw new Error(`Wallet "${walletId}" already exists`);
        }

        const network = this.getNetwork(networkName);
        const mnemonic = await CreateTonMnemonic();
        const { adapter, publicKey } = await this.createWalletAdapter(mnemonic, version, network);

        const address = adapter.getAddress();
        const createdAt = new Date().toISOString();

        // Store wallet data
        const storedWallet: StoredWallet = {
            walletId,
            mnemonic,
            publicKey,
            address,
            network: networkName,
            version,
            createdAt,
        };
        this.wallets.set(walletId, storedWallet);

        // Add to kit and cache
        const kit = await this.getKit();
        const wallet = await kit.addWallet(adapter);
        if (wallet) {
            this.loadedWallets.set(walletId, wallet);
        }

        return {
            walletId,
            publicKey,
            address,
            network: networkName,
            version,
            createdAt,
        };
    }

    /**
     * Import a wallet from mnemonic
     */
    async importWallet(params: ImportWalletParams): Promise<WalletInfo> {
        const { walletId, mnemonic, version, network: networkName } = params;

        // Check if wallet already exists
        if (this.wallets.has(walletId)) {
            throw new Error(`Wallet "${walletId}" already exists`);
        }

        // Validate mnemonic
        if (mnemonic.length !== 24) {
            throw new Error(`Invalid mnemonic: expected 24 words, got ${mnemonic.length}`);
        }

        const network = this.getNetwork(networkName);
        const { adapter, publicKey } = await this.createWalletAdapter(mnemonic, version, network);

        const address = adapter.getAddress();
        const createdAt = new Date().toISOString();

        // Store wallet data
        const storedWallet: StoredWallet = {
            walletId,
            mnemonic,
            publicKey,
            address,
            network: networkName,
            version,
            createdAt,
        };
        this.wallets.set(walletId, storedWallet);

        // Add to kit and cache
        const kit = await this.getKit();
        const wallet = await kit.addWallet(adapter);
        if (wallet) {
            this.loadedWallets.set(walletId, wallet);
        }

        return {
            walletId,
            publicKey,
            address,
            network: networkName,
            version,
            createdAt,
        };
    }

    /**
     * Get wallet info by ID
     */
    async getWallet(walletId: string): Promise<WalletInfo | null> {
        const stored = this.wallets.get(walletId);
        if (!stored) {
            return null;
        }

        return {
            walletId: stored.walletId,
            publicKey: stored.publicKey,
            address: stored.address,
            network: stored.network,
            version: stored.version,
            createdAt: stored.createdAt,
        };
    }

    /**
     * List all wallet IDs
     */
    async listWalletIds(): Promise<string[]> {
        return Array.from(this.wallets.keys());
    }

    /**
     * Delete a wallet
     */
    async deleteWallet(walletId: string): Promise<boolean> {
        const stored = this.wallets.get(walletId);
        if (!stored) {
            return false;
        }

        // Remove from cache
        this.loadedWallets.delete(walletId);

        // Remove from wallets map
        return this.wallets.delete(walletId);
    }

    /**
     * Get or load a wallet for signing
     */
    private async getWalletForSigning(walletId: string): Promise<Wallet> {
        // Check cache
        if (this.loadedWallets.has(walletId)) {
            return this.loadedWallets.get(walletId)!;
        }

        const stored = this.wallets.get(walletId);
        if (!stored) {
            throw new Error('Wallet not found');
        }

        const network = this.getNetwork(stored.network);
        const { adapter } = await this.createWalletAdapter(stored.mnemonic, stored.version, network);

        const kit = await this.getKit();
        let wallet = await kit.addWallet(adapter);

        if (!wallet) {
            // Wallet already exists in kit, get it
            const kitWalletId = `${network.chainId}:${stored.address}`;
            wallet = kit.getWallet(kitWalletId);
            if (!wallet) {
                throw new Error('Failed to load wallet');
            }
        }

        this.loadedWallets.set(walletId, wallet);
        return wallet;
    }

    /**
     * Sign a transaction
     */
    async signTransaction(_walletId: string, _unsignedBoc: string): Promise<string> {
        // Parse the BOC and sign
        // Note: This is a simplified implementation. In practice, you'd need to:
        // 1. Parse the unsigned BOC
        // 2. Sign it with the wallet's signer
        // 3. Return the signed BOC

        // For now, we'll use the wallet's sendTransaction method
        // which expects a Transaction object, not a BOC string.
        // This would need to be adjusted based on actual usage.

        throw new Error('signTransaction with BOC not implemented. Use the wallet service for transaction signing.');
    }

    /**
     * Sign a message
     */
    async signMessage(walletId: string, message: Buffer): Promise<Buffer> {
        const stored = this.wallets.get(walletId);
        if (!stored) {
            throw new Error('Wallet not found');
        }

        const signer = await Signer.fromMnemonic(stored.mnemonic, { type: 'ton' });
        const signature = await signer.sign(message);

        return Buffer.from(signature, 'hex');
    }

    /**
     * Close and cleanup
     */
    async close(): Promise<void> {
        if (this.kit) {
            await this.kit.close();
            this.kit = null;
        }
        this.loadedWallets.clear();
    }

    /**
     * Get TonWalletKit instance for direct wallet operations
     * Used by WalletService for balance/transfer operations
     */
    async getKitInstance(): Promise<TonWalletKit> {
        return this.getKit();
    }

    /**
     * Get a loaded wallet by ID for direct operations
     * Used by WalletService for balance/transfer operations
     */
    async getLoadedWallet(walletId: string): Promise<Wallet> {
        return this.getWalletForSigning(walletId);
    }

    /**
     * Get stored wallet data (internal use only)
     */
    getStoredWallet(walletId: string): StoredWallet | undefined {
        return this.wallets.get(walletId);
    }
}
