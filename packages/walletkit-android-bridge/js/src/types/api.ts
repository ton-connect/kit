/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { WalletKitBridgeEventCallback } from './events';
import type { WalletKitBridgeInitConfig } from './walletkit';

export type PromiseOrValue<T> = T | Promise<T>;

export interface SetEventsListenersArgs {
    callback?: WalletKitBridgeEventCallback;
}

export interface DerivePublicKeyFromMnemonicArgs {
    mnemonic: string[];
}

export interface SignDataWithMnemonicArgs {
    words: string[];
    data: number[];
    mnemonicType?: 'ton' | 'bip39';
}

export interface CreateTonMnemonicArgs {
    count?: number;
}

export interface CreateWalletWithSignerArgs {
    publicKey: string;
    network?: string;
    signerId: string;
}

export interface RespondToSignRequestArgs {
    signerId: string;
    requestId: string;
    signature?: number[] | string;
    error?: string;
}

export interface CreateWalletUsingMnemonicArgs {
    mnemonic: string[];
    network?: string;
}

export interface CreateWalletUsingSecretKeyArgs {
    secretKey: string;
    network?: string;
}

export interface RemoveWalletArgs {
    address: string;
}

export interface GetWalletStateArgs {
    address: string;
}

export interface GetRecentTransactionsArgs {
    address: string;
    limit?: number;
}

export interface CreateTransferTonTransactionArgs {
    walletAddress: string;
    toAddress: string;
    amount: string;
    comment?: string;
    body?: string;
    stateInit?: string;
}

export interface MultiTransferMessage {
    toAddress: string;
    amount: string;
    comment?: string;
    body?: string;
    stateInit?: string;
}

export interface CreateTransferMultiTonTransactionArgs {
    walletAddress: string;
    messages: MultiTransferMessage[];
}

export interface TransactionContentArgs {
    walletAddress: string;
    transactionContent: string;
}

export interface TonConnectRequestEvent extends Record<string, unknown> {
    id?: string;
    wallet?: unknown;
    walletAddress?: string;
    request?: Record<string, unknown> & { from?: string };
    preview?: Record<string, unknown> & { manifest?: { url?: string } };
    dAppInfo?: Record<string, unknown> & { url?: string };
    domain?: string;
    isJsBridge?: boolean;
    tabId?: string;
    messageId?: string;
}

export interface ApproveConnectRequestArgs {
    event: TonConnectRequestEvent;
    walletAddress: string;
}

export interface RejectConnectRequestArgs {
    event: TonConnectRequestEvent;
    reason?: string;
}

export interface ApproveTransactionRequestArgs {
    event: TonConnectRequestEvent;
}

export interface RejectTransactionRequestArgs {
    event: TonConnectRequestEvent;
    reason?: string;
}

export interface ApproveSignDataRequestArgs {
    event: TonConnectRequestEvent;
}

export interface RejectSignDataRequestArgs {
    event: TonConnectRequestEvent;
    reason?: string;
}

export interface DisconnectSessionArgs {
    sessionId?: string;
}

export interface GetNftsArgs {
    address: string;
    limit?: number;
    offset?: number;
}

export interface GetNftArgs {
    address: string;
}

export interface CreateTransferNftTransactionArgs {
    address: string;
    nftAddress: string;
    transferAmount: string;
    toAddress: string;
    comment?: string;
}

export interface CreateTransferNftRawTransactionArgs {
    address: string;
    nftAddress: string;
    transferAmount: string;
    transferMessage: unknown;
}

export interface GetJettonsArgs {
    address: string;
    limit?: number;
    offset?: number;
}

export interface CreateTransferJettonTransactionArgs {
    address: string;
    jettonAddress: string;
    amount: string;
    toAddress: string;
    comment?: string;
}

export interface GetJettonBalanceArgs {
    address: string;
    jettonAddress: string;
}

export interface GetJettonWalletAddressArgs {
    address: string;
    jettonAddress: string;
}

export interface ProcessInternalBrowserRequestArgs {
    messageId: string;
    method: string;
    params?: unknown;
    from?: string;
    url?: string;
    manifestUrl?: string;
}

export interface EmitBrowserPageArgs {
    url: string;
}

export interface EmitBrowserErrorArgs {
    message: string;
}

export interface EmitBrowserBridgeRequestArgs {
    messageId: string;
    method: string;
    request: string;
}

export type HandleTonConnectUrlArgs = unknown;

export interface WalletDescriptor {
    address: string;
    publicKey: string;
    version: string;
    index: number;
    network: string;
}

export interface WalletKitBridgeApi {
    init(config?: WalletKitBridgeInitConfig): PromiseOrValue<unknown>;
    setEventsListeners(args?: SetEventsListenersArgs): PromiseOrValue<{ ok: true }>;
    removeEventListeners(): PromiseOrValue<{ ok: true }>;
    derivePublicKeyFromMnemonic(args: DerivePublicKeyFromMnemonicArgs): PromiseOrValue<{ publicKey: string }>;
    signDataWithMnemonic(args: SignDataWithMnemonicArgs): PromiseOrValue<{ signature: number[] }>;
    createTonMnemonic(args?: CreateTonMnemonicArgs): PromiseOrValue<{ items: string[] }>;
    createV4R2WalletWithSigner(
        args: CreateWalletWithSignerArgs,
    ): PromiseOrValue<{ address: string; publicKey: string }>;
    createV5R1WalletWithSigner(
        args: CreateWalletWithSignerArgs,
    ): PromiseOrValue<{ address: string; publicKey: string }>;
    respondToSignRequest(args: RespondToSignRequestArgs): PromiseOrValue<{ ok: true }>;
    createV4R2WalletUsingMnemonic(
        args: CreateWalletUsingMnemonicArgs,
    ): PromiseOrValue<{ address: string; publicKey: string }>;
    createV4R2WalletUsingSecretKey(
        args: CreateWalletUsingSecretKeyArgs,
    ): PromiseOrValue<{ address: string; publicKey: string }>;
    createV5R1WalletUsingMnemonic(
        args: CreateWalletUsingMnemonicArgs,
    ): PromiseOrValue<{ address: string; publicKey: string }>;
    createV5R1WalletUsingSecretKey(
        args: CreateWalletUsingSecretKeyArgs,
    ): PromiseOrValue<{ address: string; publicKey: string }>;
    getWallets(): PromiseOrValue<WalletDescriptor[]>;
    removeWallet(args: RemoveWalletArgs): PromiseOrValue<{ removed: boolean }>;
    getWalletState(args: GetWalletStateArgs): PromiseOrValue<{ balance: string; transactions: unknown[] }>;
    getRecentTransactions(args: GetRecentTransactionsArgs): PromiseOrValue<{ items: unknown[] }>;
    handleTonConnectUrl(args: HandleTonConnectUrlArgs): PromiseOrValue<unknown>;
    createTransferTonTransaction(
        args: CreateTransferTonTransactionArgs,
    ): PromiseOrValue<{ transaction: unknown; preview: unknown }>;
    createTransferMultiTonTransaction(
        args: CreateTransferMultiTonTransactionArgs,
    ): PromiseOrValue<{ transaction: unknown; preview: unknown }>;
    getTransactionPreview(args: TransactionContentArgs): PromiseOrValue<unknown>;
    handleNewTransaction(args: TransactionContentArgs): PromiseOrValue<{ success: boolean }>;
    sendTransaction(args: TransactionContentArgs): PromiseOrValue<{ signedBoc: unknown }>;
    approveConnectRequest(args: ApproveConnectRequestArgs): PromiseOrValue<Record<string, unknown>>;
    rejectConnectRequest(args: RejectConnectRequestArgs): PromiseOrValue<Record<string, unknown>>;
    approveTransactionRequest(args: ApproveTransactionRequestArgs): PromiseOrValue<unknown>;
    rejectTransactionRequest(args: RejectTransactionRequestArgs): PromiseOrValue<Record<string, unknown>>;
    approveSignDataRequest(args: ApproveSignDataRequestArgs): PromiseOrValue<unknown>;
    rejectSignDataRequest(args: RejectSignDataRequestArgs): PromiseOrValue<Record<string, unknown>>;
    listSessions(): PromiseOrValue<unknown>;
    disconnectSession(args?: DisconnectSessionArgs): PromiseOrValue<unknown>;
    getNfts(args: GetNftsArgs): PromiseOrValue<unknown>;
    getNft(args: GetNftArgs): PromiseOrValue<unknown>;
    createTransferNftTransaction(args: CreateTransferNftTransactionArgs): PromiseOrValue<unknown>;
    createTransferNftRawTransaction(args: CreateTransferNftRawTransactionArgs): PromiseOrValue<unknown>;
    getJettons(args: GetJettonsArgs): PromiseOrValue<unknown>;
    createTransferJettonTransaction(args: CreateTransferJettonTransactionArgs): PromiseOrValue<unknown>;
    getJettonBalance(args: GetJettonBalanceArgs): PromiseOrValue<unknown>;
    getJettonWalletAddress(args: GetJettonWalletAddressArgs): PromiseOrValue<unknown>;
    processInternalBrowserRequest(args: ProcessInternalBrowserRequestArgs): PromiseOrValue<unknown>;
    emitBrowserPageStarted(args: EmitBrowserPageArgs): PromiseOrValue<{ success: boolean }>;
    emitBrowserPageFinished(args: EmitBrowserPageArgs): PromiseOrValue<{ success: boolean }>;
    emitBrowserError(args: EmitBrowserErrorArgs): PromiseOrValue<{ success: boolean }>;
    emitBrowserBridgeRequest(args: EmitBrowserBridgeRequestArgs): PromiseOrValue<{ success: boolean }>;
}
