/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * KeyManager - Manages keypair storage for MCP controlled wallets
 *
 * Stores keys in ~/.ton/key.json
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

import { mnemonicNew, keyPairFromSeed, mnemonicToPrivateKey } from '@ton/crypto';

import type { NetworkType } from '../types/config.js';

export interface StoredKeyData {
    /** User's wallet address that this keypair controls */
    walletAddress: string;
    /** Public key in hex format */
    publicKey: string;
    /** Private key (seed) in hex format */
    privateKey: string;
    /** Network */
    network: NetworkType;
    /** Creation timestamp */
    createdAt: string;
}

export interface KeyPairResult {
    publicKey: Uint8Array;
    secretKey: Uint8Array;
}

const KEY_DIR = join(homedir(), '.ton');
const KEY_FILE = join(KEY_DIR, 'key.json');

/**
 * KeyManager handles creation and storage of keypairs for controlled wallets
 */
export class KeyManager {
    /**
     * Check if a key file exists
     */
    static async hasStoredKey(): Promise<boolean> {
        return existsSync(KEY_FILE);
    }

    /**
     * Load stored key data from ~/.ton/key.json
     */
    static async loadKey(): Promise<StoredKeyData | null> {
        try {
            if (!existsSync(KEY_FILE)) {
                return null;
            }
            const data = await readFile(KEY_FILE, 'utf-8');
            return JSON.parse(data) as StoredKeyData;
        } catch {
            return null;
        }
    }

    /**
     * Generate a new keypair and store it
     */
    static async generateAndStoreKey(walletAddress: string, network: NetworkType): Promise<StoredKeyData> {
        // Generate new mnemonic and derive keypair
        const mnemonic = await mnemonicNew(24);
        const keyPair = await mnemonicToPrivateKey(mnemonic);

        const keyData: StoredKeyData = {
            walletAddress,
            publicKey: Buffer.from(keyPair.publicKey).toString('hex'),
            privateKey: Buffer.from(keyPair.secretKey.slice(0, 32)).toString('hex'), // Store only seed (first 32 bytes)
            network,
            createdAt: new Date().toISOString(),
        };

        await KeyManager.saveKey(keyData);
        return keyData;
    }

    /**
     * Save key data to ~/.ton/key.json
     */
    static async saveKey(keyData: StoredKeyData): Promise<void> {
        // Ensure directory exists
        if (!existsSync(KEY_DIR)) {
            await mkdir(KEY_DIR, { recursive: true });
        }

        await writeFile(KEY_FILE, JSON.stringify(keyData, null, 2), 'utf-8');
    }

    /**
     * Get keypair from stored key data
     */
    static getKeyPair(keyData: StoredKeyData): KeyPairResult {
        const privateKeyBytes = Buffer.from(keyData.privateKey, 'hex');
        const keyPair = keyPairFromSeed(privateKeyBytes);
        return {
            publicKey: keyPair.publicKey,
            secretKey: keyPair.secretKey,
        };
    }

    /**
     * Get the path to the key file
     */
    static getKeyFilePath(): string {
        return KEY_FILE;
    }

    /**
     * Delete stored key
     */
    static async deleteKey(): Promise<void> {
        const { unlink } = await import('node:fs/promises');
        if (existsSync(KEY_FILE)) {
            await unlink(KEY_FILE);
        }
    }
}
