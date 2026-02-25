/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * SqliteSignerAdapter - SQLite-based signer with encrypted mnemonic storage
 */

import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'crypto';

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

import type { ISignerAdapter, WalletInfo, CreateWalletParams, ImportWalletParams } from './types.js';
import type { SqliteDatabase } from './SqliteStorageAdapter.js';

/**
 * Stored wallet row structure in SQLite
 */
interface StoredWalletRow {
    wallet_id: string;
    encrypted_mnemonic: string;
    public_key: string;
    address: string;
    network: string;
    version: string;
    created_at: string;
}

/**
 * Configuration for SqliteSignerAdapter
 */
export interface SqliteSignerConfig {
    db: SqliteDatabase;
    encryptionKey: string | Buffer;
    tableName?: string;
}

/**
 * SQLite-based signer adapter with encrypted mnemonic storage.
 */
export class SqliteSignerAdapter implements ISignerAdapter {
    private readonly db: SqliteDatabase;
    private readonly tableName: string;
    private readonly encryptionKey: Buffer;
    private kit: TonWalletKit | null = null;
    private loadedWallets: Map<string, Wallet> = new Map();

    constructor(config: SqliteSignerConfig) {
        this.db = config.db;
        this.tableName = config.tableName ?? 'wallets';
        this.encryptionKey = this.deriveKey(config.encryptionKey);
        this.initializeTable();
    }

    private deriveKey(key: string | Buffer): Buffer {
        if (Buffer.isBuffer(key)) {
            if (key.length !== 32) {
                throw new Error('Encryption key must be 32 bytes');
            }
            return key;
        }

        if (/^[0-9a-fA-F]{64}$/.test(key)) {
            return Buffer.from(key, 'hex');
        }

        return scryptSync(key, 'ton-mcp-salt', 32);
    }

    private initializeTable(): void {
        this.db.exec(`
            CREATE TABLE IF NOT EXISTS ${this.tableName} (
                wallet_id TEXT PRIMARY KEY,
                encrypted_mnemonic TEXT NOT NULL,
                public_key TEXT NOT NULL,
                address TEXT NOT NULL,
                network TEXT NOT NULL,
                version TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
        `);

        this.db.exec(`
            CREATE INDEX IF NOT EXISTS idx_${this.tableName}_address 
            ON ${this.tableName}(address)
        `);
    }

    private encryptMnemonic(mnemonic: string[]): string {
        const iv = randomBytes(16);
        const cipher = createCipheriv('aes-256-gcm', this.encryptionKey, iv);

        const plaintext = JSON.stringify(mnemonic);
        const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
        const authTag = cipher.getAuthTag();

        return `${iv.toString('base64')}:${authTag.toString('base64')}:${encrypted.toString('base64')}`;
    }

    private decryptMnemonic(encryptedData: string): string[] {
        const [ivB64, authTagB64, encryptedB64] = encryptedData.split(':');
        const iv = Buffer.from(ivB64, 'base64');
        const authTag = Buffer.from(authTagB64, 'base64');
        const encrypted = Buffer.from(encryptedB64, 'base64');

        const decipher = createDecipheriv('aes-256-gcm', this.encryptionKey, iv);
        decipher.setAuthTag(authTag);

        const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
        return JSON.parse(decrypted.toString('utf8'));
    }

    private getNetwork(networkName: 'mainnet' | 'testnet'): Network {
        return networkName === 'mainnet' ? Network.mainnet() : Network.testnet();
    }

    private async getKit(): Promise<TonWalletKit> {
        if (!this.kit) {
            this.kit = new TonWalletKit({
                networks: {
                    [Network.mainnet().chainId]: {},
                    [Network.testnet().chainId]: {},
                    [Network.tetra().chainId]: {},
                },
                storage: new MemoryStorageAdapter(),
            });
            await this.kit.waitForReady();
        }
        return this.kit;
    }

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

        const publicKey = Buffer.from(signer.publicKey).toString('hex');

        return { adapter, publicKey };
    }

    async createWallet(params: CreateWalletParams): Promise<WalletInfo> {
        const { walletId, version, network: networkName } = params;

        const existing = this.db.prepare(`SELECT wallet_id FROM ${this.tableName} WHERE wallet_id = ?`).get(walletId);
        if (existing) {
            throw new Error(`Wallet "${walletId}" already exists`);
        }

        const network = this.getNetwork(networkName);
        const mnemonic = await CreateTonMnemonic();
        const { adapter, publicKey } = await this.createWalletAdapter(mnemonic, version, network);

        const address = adapter.getAddress();
        const createdAt = new Date().toISOString();

        const encryptedMnemonic = this.encryptMnemonic(mnemonic);
        this.db
            .prepare(
                `INSERT INTO ${this.tableName} (wallet_id, encrypted_mnemonic, public_key, address, network, version, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
            )
            .run(walletId, encryptedMnemonic, publicKey, address, networkName, version, createdAt);

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

    async importWallet(params: ImportWalletParams): Promise<WalletInfo> {
        const { walletId, mnemonic, version, network: networkName } = params;

        const existing = this.db.prepare(`SELECT wallet_id FROM ${this.tableName} WHERE wallet_id = ?`).get(walletId);
        if (existing) {
            throw new Error(`Wallet "${walletId}" already exists`);
        }

        if (mnemonic.length !== 24) {
            throw new Error(`Invalid mnemonic: expected 24 words, got ${mnemonic.length}`);
        }

        const network = this.getNetwork(networkName);
        const { adapter, publicKey } = await this.createWalletAdapter(mnemonic, version, network);

        const address = adapter.getAddress();
        const createdAt = new Date().toISOString();

        const encryptedMnemonic = this.encryptMnemonic(mnemonic);
        this.db
            .prepare(
                `INSERT INTO ${this.tableName} (wallet_id, encrypted_mnemonic, public_key, address, network, version, created_at)
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
            )
            .run(walletId, encryptedMnemonic, publicKey, address, networkName, version, createdAt);

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

    async getWallet(walletId: string): Promise<WalletInfo | null> {
        const row = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE wallet_id = ?`).get(walletId) as
            | StoredWalletRow
            | undefined;

        if (!row) {
            return null;
        }

        return {
            walletId: row.wallet_id,
            publicKey: row.public_key,
            address: row.address,
            network: row.network as 'mainnet' | 'testnet',
            version: row.version as 'v5r1' | 'v4r2',
            createdAt: row.created_at,
        };
    }

    async listWalletIds(): Promise<string[]> {
        const rows = this.db.prepare(`SELECT wallet_id FROM ${this.tableName}`).all() as { wallet_id: string }[];
        return rows.map((row) => row.wallet_id);
    }

    async deleteWallet(walletId: string): Promise<boolean> {
        this.loadedWallets.delete(walletId);

        const result = this.db.prepare(`DELETE FROM ${this.tableName} WHERE wallet_id = ?`).run(walletId);
        return result.changes > 0;
    }

    private async getWalletForSigning(walletId: string): Promise<Wallet> {
        if (this.loadedWallets.has(walletId)) {
            return this.loadedWallets.get(walletId)!;
        }

        const row = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE wallet_id = ?`).get(walletId) as
            | StoredWalletRow
            | undefined;

        if (!row) {
            throw new Error('Wallet not found');
        }

        const mnemonic = this.decryptMnemonic(row.encrypted_mnemonic);
        const network = this.getNetwork(row.network as 'mainnet' | 'testnet');
        const { adapter } = await this.createWalletAdapter(mnemonic, row.version as 'v5r1' | 'v4r2', network);

        const kit = await this.getKit();
        let wallet = await kit.addWallet(adapter);

        if (!wallet) {
            const kitWalletId = `${network.chainId}:${row.address}`;
            wallet = kit.getWallet(kitWalletId);
            if (!wallet) {
                throw new Error('Failed to load wallet');
            }
        }

        this.loadedWallets.set(walletId, wallet);
        return wallet;
    }

    async signTransaction(_walletId: string, _unsignedBoc: string): Promise<string> {
        throw new Error('signTransaction with BOC not implemented. Use the wallet service for transaction signing.');
    }

    async signMessage(walletId: string, message: Buffer): Promise<Buffer> {
        const row = this.db
            .prepare(`SELECT encrypted_mnemonic FROM ${this.tableName} WHERE wallet_id = ?`)
            .get(walletId) as { encrypted_mnemonic: string } | undefined;

        if (!row) {
            throw new Error('Wallet not found');
        }

        const mnemonic = this.decryptMnemonic(row.encrypted_mnemonic);
        const signer = await Signer.fromMnemonic(mnemonic, { type: 'ton' });
        const signature = await signer.sign(message);

        return Buffer.from(signature, 'hex');
    }

    async close(): Promise<void> {
        if (this.kit) {
            await this.kit.close();
            this.kit = null;
        }
        this.loadedWallets.clear();
    }

    async getKitInstance(): Promise<TonWalletKit> {
        return this.getKit();
    }

    async getLoadedWallet(walletId: string): Promise<Wallet> {
        return this.getWalletForSigning(walletId);
    }

    getStoredWallet(walletId: string): { mnemonic: string[]; version: 'v5r1' | 'v4r2' } | undefined {
        const row = this.db
            .prepare(`SELECT encrypted_mnemonic, version FROM ${this.tableName} WHERE wallet_id = ?`)
            .get(walletId) as { encrypted_mnemonic: string; version: string } | undefined;

        if (!row) {
            return undefined;
        }

        return {
            mnemonic: this.decryptMnemonic(row.encrypted_mnemonic),
            version: row.version as 'v5r1' | 'v4r2',
        };
    }
}
