// Wallet-related type definitions

import { Address, SendMode } from '@ton/core';
import { CHAIN } from '@tonconnect/protocol';
import Transport from '@ledgerhq/hw-transport';

import { ConnectExtraCurrency, ConnectTransactionParamContent } from './internal';
import { JettonTransferParams } from './jettons';
import { NftTransferParamsHuman, NftTransferParamsRaw } from './nfts';
import { TransactionPreview } from './events';
import { ApiClient } from './toncenter/ApiClient';
import { LimitRequest } from '../core/ApiClientToncenter';
import type { NftItem } from './toncenter/NftItem';
import { NftItems } from './toncenter/NftItems';
import { PrepareSignDataResult } from '../utils/signData/sign';
import { Hash } from './primitive';
import { TonProofParsedMessage } from '../utils/tonProof';

/**
 * TON network types
 */
export type WalletVersion = 'v5r1' | 'v4r2' | 'unknown';

export type WalletSigner = (bytes: Uint8Array) => Promise<Uint8Array>;

export interface WalletInitConfigMnemonicInterface {
    mnemonic: string[];
    version?: WalletVersion;
    mnemonicType?: 'ton' | 'bip39';
    walletId?: bigint;
    network?: CHAIN;
}

export function createWalletInitConfigMnemonic(
    params: WalletInitConfigMnemonicInterface,
): WalletInitConfigMnemonicInterface {
    return {
        mnemonic: params.mnemonic,
        version: params.version ?? 'v5r1',
        mnemonicType: params.mnemonicType ?? 'ton',
        walletId: params.walletId,
        network: params.network ?? CHAIN.MAINNET,
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
    network?: CHAIN;
}

export function createWalletInitConfigPrivateKey(
    params: WalletInitConfigPrivateKeyInterface,
): WalletInitConfigPrivateKeyInterface {
    return {
        privateKey: params.privateKey,
        version: params.version ?? 'v5r1',
        walletId: params.walletId,
        network: params.network ?? CHAIN.MAINNET,
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
    network?: CHAIN;
    sign: WalletSigner;
}

export function createWalletInitConfigSigner(params: WalletInitConfigSignerInterface): WalletInitConfigSignerInterface {
    return {
        publicKey: params.publicKey,
        version: params.version ?? 'v5r1',
        walletId: params.walletId,
        network: params.network ?? CHAIN.MAINNET,
        sign: params.sign,
    };
}

export function isWalletInitConfigSigner(
    config: WalletInitConfig,
): config is ReturnType<typeof createWalletInitConfigSigner> {
    return 'publicKey' in config && 'sign' in config;
}

export interface WalletInitConfigLedgerInterface {
    /** Ledger transport instance */
    createTransport: () => Promise<Transport>; // @ledgerhq/hw-transport
    /** Derivation path for the account */
    path: number[];
    /** Wallet version - only v4r2 supported for Ledger */
    version?: 'v4r2';
    /** Wallet ID configuration */
    walletId?: number;
    /** Network */
    network?: CHAIN;
    /** Workchain */
    workchain?: number;
    /** Account index */
    accountIndex?: number;
}

export function createWalletInitConfigLedger(params: WalletInitConfigLedgerInterface): WalletInitConfigLedgerInterface {
    return {
        createTransport: params.createTransport,
        path: params.path,
        version: params.version ?? 'v4r2',
        walletId: params.walletId ?? 698983191,
        network: params.network ?? CHAIN.MAINNET,
        workchain: params.workchain ?? 0,
        accountIndex: params.accountIndex ?? 0,
    };
}

export function isWalletInitConfigLedger(
    config: WalletInitConfig,
): config is ReturnType<typeof createWalletInitConfigLedger> {
    return 'createTransport' in config && 'path' in config;
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

    getNetwork(): CHAIN;

    /** Get wallet's TON address */
    getAddress(options?: { testnet?: boolean }): string;

    /** Get state init for wallet deployment base64 encoded boc */
    getStateInit(): Promise<string>;

    getSignedSendTransaction(
        input: ConnectTransactionParamContent,
        options?: {
            fakeSignature: boolean;
        },
    ): Promise<string>; // base64 encoded boc
    getSignedSignData(
        input: PrepareSignDataResult,
        options?: {
            fakeSignature: boolean;
        },
    ): Promise<Hash>;
    getSignedTonProof(
        input: TonProofParsedMessage,
        options?: {
            fakeSignature: boolean;
        },
    ): Promise<Hash>;
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
    createTransferTonTransaction(params: TonTransferParams): Promise<ConnectTransactionParamContent>;
    createTransferMultiTonTransaction(params: TonTransferManyParams): Promise<ConnectTransactionParamContent>;

    getTransactionPreview(data: ConnectTransactionParamContent | Promise<ConnectTransactionParamContent>): Promise<{
        preview: TransactionPreview;
    }>;

    getBalance(): Promise<bigint>;
}

export interface WalletJettonInterface {
    createTransferJettonTransaction(params: JettonTransferParams): Promise<ConnectTransactionParamContent>;
    getJettonBalance(jettonAddress: string): Promise<bigint>;
    getJettonWalletAddress(jettonAddress: string): Promise<string>;
}

export interface WalletNftInterface {
    createTransferNftTransaction(params: NftTransferParamsHuman): Promise<ConnectTransactionParamContent>;
    createTransferNftRawTransaction(params: NftTransferParamsRaw): Promise<ConnectTransactionParamContent>;
    getNfts(params: LimitRequest): Promise<NftItems>;
    getNft(address: Address | string): Promise<NftItem | null>;
}

export type WalletInitConfig =
    | WalletInitInterface
    | WalletInitConfigMnemonicInterface
    | WalletInitConfigPrivateKeyInterface
    | WalletInitConfigSignerInterface
    | WalletInitConfigLedgerInterface;

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
