/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * ISignerAdapter - Interface for secure key management and signing operations
 *
 * Critical: This adapter NEVER returns private keys or seed phrases.
 * Seed phrases are accepted as input but stored securely by the adapter implementation.
 */

/**
 * Wallet information returned by signer operations.
 * Contains only public data - no private keys or seed phrases.
 */
export interface WalletInfo {
    /** Internal wallet ID (may be user-prefixed internally by the adapter) */
    walletId: string;
    /** Hex-encoded public key */
    publicKey: string;
    /** TON address (user-friendly format) */
    address: string;
    /** Network the wallet is configured for */
    network: 'mainnet' | 'testnet';
    /** Wallet contract version */
    version: 'v5r1' | 'v4r2';
    /** ISO timestamp when wallet was created */
    createdAt: string;
}

/**
 * Parameters for creating a new wallet
 */
export interface CreateWalletParams {
    /** Unique wallet ID (should be user-scoped externally) */
    walletId: string;
    /** Wallet contract version */
    version: 'v5r1' | 'v4r2';
    /** Network to create the wallet on */
    network: 'mainnet' | 'testnet';
}

/**
 * Parameters for importing a wallet from mnemonic
 */
export interface ImportWalletParams {
    /** Unique wallet ID (should be user-scoped externally) */
    walletId: string;
    /** 24-word mnemonic phrase (stored securely, never returned) */
    mnemonic: string[];
    /** Wallet contract version */
    version: 'v5r1' | 'v4r2';
    /** Network to import the wallet on */
    network: 'mainnet' | 'testnet';
}

/**
 * Interface for secure key management and signing operations.
 *
 * Implementations should:
 * - Store keys encrypted (e.g., AES-256-GCM with master key derived via PBKDF2/Argon2)
 * - Never expose private keys or seed phrases through any method
 * - Support user isolation if operating in multi-tenant mode
 */
export interface ISignerAdapter {
    /**
     * Create a new wallet with generated keys.
     * The mnemonic is generated and stored securely - NEVER returned.
     *
     * @param params - Wallet creation parameters
     * @returns Wallet info (address, public key) - NO private data
     */
    createWallet(params: CreateWalletParams): Promise<WalletInfo>;

    /**
     * Import a wallet from mnemonic.
     * The mnemonic is stored securely by the adapter - NEVER returned.
     *
     * @param params - Import parameters including mnemonic
     * @returns Wallet info (address, public key) - NO private data
     */
    importWallet(params: ImportWalletParams): Promise<WalletInfo>;

    /**
     * Get wallet info by ID.
     *
     * @param walletId - The wallet ID
     * @returns Wallet info or null if not found
     */
    getWallet(walletId: string): Promise<WalletInfo | null>;

    /**
     * List all wallet IDs managed by this adapter.
     * For user isolation, the wrapper should filter by user prefix.
     *
     * @returns Array of wallet IDs
     */
    listWalletIds(): Promise<string[]>;

    /**
     * Delete a wallet and its keys.
     *
     * @param walletId - The wallet ID to delete
     * @returns true if deleted, false if not found
     */
    deleteWallet(walletId: string): Promise<boolean>;

    /**
     * Sign a transaction.
     * The adapter loads the private key internally and signs.
     *
     * @param walletId - The wallet ID to sign with
     * @param unsignedBoc - Base64-encoded unsigned transaction BOC
     * @returns Base64-encoded signed transaction BOC
     */
    signTransaction(walletId: string, unsignedBoc: string): Promise<string>;

    /**
     * Sign an arbitrary message.
     *
     * @param walletId - The wallet ID to sign with
     * @param message - The message bytes to sign
     * @returns The signature bytes
     */
    signMessage(walletId: string, message: Buffer): Promise<Buffer>;
}
