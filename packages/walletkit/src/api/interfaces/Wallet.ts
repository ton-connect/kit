/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    TokenAmount,
    TONTransferRequest,
    TransactionEmulatedPreview,
    TransactionRequest,
    SendTransactionResponse,
    JettonsRequest,
    UserFriendlyAddress,
    JettonsResponse,
    JettonsTransferRequest,
    NFTsResponse,
    NFTsRequest,
    NFT,
    NFTTransferRequest,
    NFTRawTransferRequest,
} from '../models';
import type { WalletAdapter } from './WalletAdapter';
import type { ProcessToncenterMoneyFlowHandler } from '../../types';

export type Wallet = WalletAdapter & WalletTonInterface & WalletJettonInterface & WalletNftInterface;

export interface WalletTonInterface {
    createTransferTonTransaction(params: TONTransferRequest): Promise<TransactionRequest>;
    createTransferMultiTonTransaction(params: [TONTransferRequest]): Promise<TransactionRequest>;

    getTransactionPreview(
        data: TransactionRequest | Promise<TransactionRequest>,
        extendHandlers?: ProcessToncenterMoneyFlowHandler[],
    ): Promise<TransactionEmulatedPreview>;

    sendTransaction(request: TransactionRequest): Promise<SendTransactionResponse>;

    getBalance(): Promise<TokenAmount>;
}

export interface WalletJettonInterface {
    createTransferJettonTransaction(params: JettonsTransferRequest): Promise<TransactionRequest>;
    getJettonBalance(jettonAddress: UserFriendlyAddress): Promise<TokenAmount>;
    getJettonWalletAddress(jettonAddress: UserFriendlyAddress): Promise<UserFriendlyAddress>;
    getJettons(params?: JettonsRequest): Promise<JettonsResponse>;
}

export interface WalletNftInterface {
    createTransferNftTransaction(params: NFTTransferRequest): Promise<TransactionRequest>;
    createTransferNftRawTransaction(params: NFTRawTransferRequest): Promise<TransactionRequest>;
    getNfts(params: NFTsRequest): Promise<NFTsResponse>;
    getNft(address: UserFriendlyAddress): Promise<NFT | null>;
}
