// Wallet-related type definitions

import { SendMode } from '@ton/core';

import { ConnectExtraCurrency, ConnectTransactionParamContent } from './internal';
import { JettonTransferParams } from './jettons';
import { NftTransferParamsHuman, NftTransferParamsNative } from './nfts';
import { TransactionPreview } from './events';
import { ApiClient } from './toncenter/ApiClient';

/**
 * TON network types
 */
export type TonNetwork = 'mainnet' | 'testnet';

export type WalletVersion = 'v5r1' | 'unknown'; // | 'v4r2';

export interface WalletInitConfigMnemonicInterface {
    mnemonic: string[];
    version?: WalletVersion;
    mnemonicType?: 'ton' | 'bip39';
    walletId?: bigint;
    network?: TonNetwork;
}

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

export interface WalletInitConfigPrivateKeyInterface {
    privateKey: string;
    version?: WalletVersion;
    walletId?: number;
    network?: TonNetwork;
}

export class WalletInitConfigPrivateKey {
    privateKey: string; // private key in hex format
    version: WalletVersion;
    walletId?: bigint;
    network: TonNetwork;

    constructor({
        privateKey,
        version = 'v5r1',
        walletId,
        network,
    }: {
        privateKey: string;
        version?: WalletVersion;
        walletId?: bigint;
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
export interface WalletInitInterface {
    /** Unique identifier for this wallet (typically public key) */
    publicKey: Uint8Array;

    /** Wallet contract version (e.g., 'v4r2', 'v5r1') */
    version: string;

    client: ApiClient;

    /** Sign raw bytes with wallet's private key */
    sign(bytes: Uint8Array): Promise<Uint8Array>;

    /** Get wallet's TON address */
    getAddress(options?: { testnet?: boolean }): string;

    /** Get state init for wallet deployment base64 encoded boc */
    getStateInit(): Promise<string>;

    getSignedExternal(
        input: ConnectTransactionParamContent,
        options: {
            fakeSignature: boolean;
        },
    ): Promise<string>;
}

export type TonTransferMessage = {
    toAddress: string;
    amount: string;
    stateInit?: string; // base64 boc
    extraCurrency?: ConnectExtraCurrency;
    mode?: SendMode;
} & (TonTransferParamsBody | TonTransferParamsComment);
export type TonTransferParams = TonTransferMessage;

export type TonTransferManyParams = {
    messages: TonTransferMessage[];
};

export interface TonTransferParamsBody {
    body?: string; // base64 boc
    comment?: never;
}

export interface TonTransferParamsComment {
    body?: never;
    comment?: string;
}

export interface WalletTonInterface {
    createSendTon(params: TonTransferParams): Promise<ConnectTransactionParamContent>;
    createSendTonMany(params: TonTransferManyParams): Promise<ConnectTransactionParamContent>;
    getBalance(): Promise<bigint>;

    prepareTransaction(data: ConnectTransactionParamContent | Promise<ConnectTransactionParamContent>): Promise<{
        transaction: ConnectTransactionParamContent;
        preview: TransactionPreview;
    }>;

    sendTon(params: TonTransferParams): Promise<{
        transaction: ConnectTransactionParamContent;
        preview: TransactionPreview;
    }>;
}

export interface WalletJettonInterface {
    createSendJetton(params: JettonTransferParams): Promise<ConnectTransactionParamContent>;
    getBalance(jettonAddress: string): Promise<bigint>;
    getJettonWalletAddress(jettonAddress: string): Promise<string>;
}

export interface WalletNftInterface {
    createSendNft(params: NftTransferParamsHuman): Promise<ConnectTransactionParamContent>;
    createSendNftNative(params: NftTransferParamsNative): Promise<ConnectTransactionParamContent>;
}

export type WalletInitConfig =
    | WalletInitInterface
    | WalletInitConfigMnemonic
    | WalletInitConfigPrivateKey
    | WalletInitConfigMnemonicInterface
    | WalletInitConfigPrivateKeyInterface;

export type WalletInterface = WalletInitInterface & WalletTonInterface & WalletJettonInterface & WalletNftInterface;

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
