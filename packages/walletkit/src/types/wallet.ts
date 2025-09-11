// Wallet-related type definitions

import { Address, SendMode } from '@ton/core';

import { ConnectExtraCurrency, ConnectTransactionParamContent } from './internal';
import { JettonTransferParams } from './jettons';
import { NftTransferParamsHuman, NftTransferParamsNative } from './nfts';
import { TransactionPreview } from './events';
import { ApiClient } from './toncenter/ApiClient';
import { LimitRequest } from '../core/ApiClientToncenter';
import type { NftItem } from './toncenter/NftItem';
import { NftItems } from './toncenter/NftItems';

/**
 * TON network types
 */
export type TonNetwork = 'mainnet' | 'testnet';

export type WalletVersion = 'v5r1' | 'unknown'; // | 'v4r2';

export type WalletSigner = (bytes: Uint8Array) => Promise<Uint8Array>;

export interface WalletInitConfigMnemonicInterface {
    mnemonic: string[];
    version?: WalletVersion;
    mnemonicType?: 'ton' | 'bip39';
    walletId?: bigint;
    network?: TonNetwork;
}

export function createWalletInitConfigMnemonic(
    params: WalletInitConfigMnemonicInterface,
): WalletInitConfigMnemonicInterface {
    return {
        mnemonic: params.mnemonic,
        version: params.version ?? 'v5r1',
        mnemonicType: params.mnemonicType ?? 'ton',
        walletId: params.walletId,
        network: params.network ?? 'mainnet',
    };
}

export function isWalletInitConfigMnemonic(
    config: WalletInitConfig,
): config is ReturnType<typeof createWalletInitConfigMnemonic> {
    return 'mnemonic' in config;
}

export interface WalletInitConfigPrivateKeyInterface {
    privateKey: string;
    version?: WalletVersion;
    walletId?: number;
    network?: TonNetwork;
}

export function createWalletInitConfigPrivateKey(
    params: WalletInitConfigPrivateKeyInterface,
): WalletInitConfigPrivateKeyInterface {
    return {
        privateKey: params.privateKey,
        version: params.version ?? 'v5r1',
        walletId: params.walletId,
        network: params.network ?? 'mainnet',
    };
}

export function isWalletInitConfigPrivateKey(
    config: WalletInitConfig,
): config is ReturnType<typeof createWalletInitConfigPrivateKey> {
    return 'privateKey' in config;
}

export interface WalletInitConfigSignerInterface {
    publicKey: Uint8Array;
    version?: WalletVersion;
    walletId?: bigint;
    network?: TonNetwork;
    sign: WalletSigner;
}

export function createWalletInitConfigSigner(params: WalletInitConfigSignerInterface): WalletInitConfigSignerInterface {
    return {
        publicKey: params.publicKey,
        version: params.version ?? 'v5r1',
        walletId: params.walletId,
        network: params.network ?? 'mainnet',
        sign: params.sign,
    };
}

export function isWalletInitConfigSigner(
    config: WalletInitConfig,
): config is ReturnType<typeof createWalletInitConfigSigner> {
    return 'publicKey' in config && 'sign' in config;
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
    sign: WalletSigner;

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
    getNfts(params: LimitRequest): Promise<NftItems>;
    getNft(address: Address | string): Promise<NftItem | null>;
}

export type WalletInitConfig =
    | WalletInitInterface
    | WalletInitConfigMnemonicInterface
    | WalletInitConfigPrivateKeyInterface
    | WalletInitConfigSignerInterface;

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
