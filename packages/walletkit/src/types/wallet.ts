// Wallet-related type definitions

import { ConnectTransactionParamContent } from './internal';

/**
 * TON network types
 */
export type TonNetwork = 'mainnet' | 'testnet';

export type WalletVersion = 'v5r1' | 'unknown'; // | 'v4r2';

export class WalletInitConfigMnemonic {
    mnemonic: string[];
    version: WalletVersion;
    mnemonicType: 'ton' | 'bip39';
    walletId?: number;
    network: TonNetwork;

    constructor({
        mnemonic,
        version = 'v5r1',
        mnemonicType = 'ton',
        walletId,
        network,
    }: {
        mnemonic: string[];
        version?: WalletVersion;
        mnemonicType?: 'ton' | 'bip39';
        walletId?: number;
        network?: TonNetwork;
    }) {
        this.mnemonic = mnemonic;
        this.version = version ?? 'v5r1';
        this.mnemonicType = mnemonicType ?? 'ton';
        this.walletId = walletId;
        this.network = network ?? 'mainnet';
    }
}

export class WalletInitConfigPrivateKey {
    privateKey: string; // private key in hex format
    version: WalletVersion;
    walletId?: number;
    network: TonNetwork;

    constructor({
        privateKey,
        version = 'v5r1',
        walletId,
        network,
    }: {
        privateKey: string;
        version?: WalletVersion;
        walletId?: number;
        network?: TonNetwork;
    }) {
        this.privateKey = privateKey;
        this.version = version;
        this.walletId = walletId;
        this.network = network ?? 'mainnet';
    }
}

/**
 * Core wallet interface that all wallets must implement
 */
export interface WalletInterface {
    /** Unique identifier for this wallet (typically public key) */
    publicKey: Uint8Array;

    /** Wallet contract version (e.g., 'v4r2', 'v5r1') */
    version: string;

    /** Sign raw bytes with wallet's private key */
    sign(bytes: Uint8Array): Promise<Uint8Array>;

    /** Get wallet's TON address */
    getAddress(options?: { testnet?: boolean }): string;

    /** Get wallet's current balance in nanotons */
    getBalance(): Promise<bigint>;

    /** Get state init for wallet deployment base64 encoded boc */
    getStateInit(): Promise<string>;

    getSignedExternal(
        input: ConnectTransactionParamContent,
        options: {
            fakeSignature: boolean;
        },
    ): Promise<string>;
}

export type WalletInitConfig = WalletInterface | WalletInitConfigMnemonic | WalletInitConfigPrivateKey;

/**
 * Wallet metadata for storage/serialization
 */
export interface WalletMetadata {
    publicKey: string;
    version: string;
    address?: string;
    lastUsed?: Date;
}

/**
 * Wallet status information
 */
export interface WalletStatus {
    isDeployed: boolean;
    balance: string;
    lastActivity?: Date;
}
