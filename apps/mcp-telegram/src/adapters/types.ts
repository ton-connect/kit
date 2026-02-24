/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Storage and Signer adapter interfaces for mcp-telegram
 */

/**
 * IStorageAdapter - Interface for persistent key-value storage
 */
export interface IStorageAdapter {
    get<T>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
    delete(key: string): Promise<boolean>;
    list(prefix: string): Promise<string[]>;
}

/**
 * Wallet information returned by signer operations.
 */
export interface WalletInfo {
    walletId: string;
    publicKey: string;
    address: string;
    network: 'mainnet' | 'testnet';
    version: 'v5r1' | 'v4r2';
    createdAt: string;
}

/**
 * Parameters for creating a new wallet
 */
export interface CreateWalletParams {
    walletId: string;
    version: 'v5r1' | 'v4r2';
    network: 'mainnet' | 'testnet';
}

/**
 * Parameters for importing a wallet from mnemonic
 */
export interface ImportWalletParams {
    walletId: string;
    mnemonic: string[];
    version: 'v5r1' | 'v4r2';
    network: 'mainnet' | 'testnet';
}

/**
 * ISignerAdapter - Interface for secure key management and signing
 */
export interface ISignerAdapter {
    createWallet(params: CreateWalletParams): Promise<WalletInfo>;
    importWallet(params: ImportWalletParams): Promise<WalletInfo>;
    getWallet(walletId: string): Promise<WalletInfo | null>;
    listWalletIds(): Promise<string[]>;
    deleteWallet(walletId: string): Promise<boolean>;
    signTransaction(walletId: string, unsignedBoc: string): Promise<string>;
    signMessage(walletId: string, message: Buffer): Promise<Buffer>;
}
