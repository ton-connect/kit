/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Wallet-related type definitions

import { Address, SendMode } from '@ton/core';
import { CHAIN } from '@tonconnect/protocol';
// import Transport from '@ledgerhq/hw-transport';

import { ConnectExtraCurrency, ConnectTransactionParamContent } from './internal';
import { JettonTransferParams } from './jettons';
import { NftTransferParamsHuman, NftTransferParamsRaw } from './nfts';
import { TransactionPreview } from './events';
import { ApiClient, LimitRequest, GetJettonsByOwnerRequest } from './toncenter/ApiClient';
import { ResponseUserJettons } from './export/responses/jettons';
import type { NftItem } from './toncenter/NftItem';
import { NftItems } from './toncenter/NftItems';
import { PrepareSignDataResult } from '../utils/signData/sign';
import { Base64String, Hex } from './primitive';
import { TonProofParsedMessage } from '../utils/tonProof';
import { EventTransactionResponse } from './events';

/**
 * TON network types
 */
export type WalletVersion = 'v5r1' | 'v4r2' | 'unknown';

export type ISigner = (bytes: Iterable<number>) => Promise<Hex>;

export type WalletSigner = {
    sign: ISigner;
    publicKey: Hex;
};

/**
 * Core wallet interface that all wallets must implement
 */
export interface IWalletAdapter {
    /** Unique identifier for this wallet (typically public key) */
    getPublicKey(): Hex;

    /** Get the network the wallet is connected to */
    getNetwork(): CHAIN;

    /** Get the TON client instance */
    getClient(): ApiClient;

    /** Get the address of the wallet */
    getAddress(options?: { testnet?: boolean }): string;

    /** Get state init for wallet deployment base64 encoded boc */
    getStateInit(): Promise<Base64String>;

    /** Get the signed send transaction */
    getSignedSendTransaction(
        input: ConnectTransactionParamContent,
        options?: {
            fakeSignature: boolean;
        },
    ): Promise<Base64String>;
    getSignedSignData(
        input: PrepareSignDataResult,
        options?: {
            fakeSignature: boolean;
        },
    ): Promise<Hex>;
    getSignedTonProof(
        input: TonProofParsedMessage,
        options?: {
            fakeSignature: boolean;
        },
    ): Promise<Hex>;
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

    sendTransaction(request: ConnectTransactionParamContent): Promise<EventTransactionResponse>;

    getBalance(): Promise<string>;
}

export interface WalletJettonInterface {
    createTransferJettonTransaction(params: JettonTransferParams): Promise<ConnectTransactionParamContent>;
    getJettonBalance(jettonAddress: string): Promise<string>;
    getJettonWalletAddress(jettonAddress: string): Promise<string>;
    getJettons(params?: Omit<GetJettonsByOwnerRequest, 'ownerAddress'>): Promise<ResponseUserJettons>;
}

export interface WalletNftInterface {
    createTransferNftTransaction(params: NftTransferParamsHuman): Promise<ConnectTransactionParamContent>;
    createTransferNftRawTransaction(params: NftTransferParamsRaw): Promise<ConnectTransactionParamContent>;
    getNfts(params: LimitRequest): Promise<NftItems>;
    getNft(address: Address | string): Promise<NftItem | null>;
}

export type IWallet = IWalletAdapter & WalletTonInterface & WalletJettonInterface & WalletNftInterface;

/**
 * Wallet metadata for storage/serialization
 */
export interface WalletMetadata {
    publicKey: string;
    version: string;
    address?: string;
    lastUsed?: Date;
}
