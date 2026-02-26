/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    BridgeEvent,
    ConnectionRequestEventPreview,
    ConnectEvent,
    ConnectEventError,
    DAppInfo,
    DisconnectEvent,
    JettonsResponse,
    NFT,
    NFTsResponse,
    SendTransactionResponse,
    TONConnectSession,
    Transaction,
    TransactionEmulatedPreview,
    TransactionRequest,
    Wallet,
    WalletResponse,
    WalletSigner,
    IntentRequestEvent,
    BatchedIntentEvent,
    TransactionIntentRequestEvent,
    SignDataIntentRequestEvent,
    ActionIntentRequestEvent,
    IntentTransactionResponse,
    IntentSignDataResponse,
    IntentErrorResponse,
    IntentActionItem,
    ConnectionApprovalProof,
} from '@ton/walletkit';

/**
 * TonConnect event payload types that can be returned from processInternalBrowserRequest.
 */
export type TonConnectEventPayload = ConnectEvent | ConnectEventError | WalletResponse | DisconnectEvent;
import type { WalletKitBridgeEventCallback } from './events';
import type { WalletKitBridgeInitConfig } from './walletkit';

export type PromiseOrValue<T> = T | Promise<T>;

export interface SetEventsListenersArgs {
    callback?: WalletKitBridgeEventCallback;
}

export interface MnemonicToKeyPairArgs {
    mnemonic: string[];
    mnemonicType?: 'ton' | 'bip39';
}

export interface SignArgs {
    data: number[];
    secretKey: number[];
}

export interface CreateTonMnemonicArgs {
    count?: number;
}

export interface CreateSignerFromMnemonicArgs {
    mnemonic: string[];
    mnemonicType?: string;
}

export interface CreateSignerFromPrivateKeyArgs {
    secretKey: string;
}

export interface CreateSignerFromCustomArgs {
    signerId: string;
    publicKey: string;
}

export interface CreateWalletAdapterArgs {
    signerId: string;
    network: { chainId: string };
    workchain?: number;
    walletId?: number;
}

export interface AddWalletArgs {
    adapterId: string;
}

export interface ReleaseRefArgs {
    id: string;
}

export interface RemoveWalletArgs {
    walletId: string;
}

export interface GetBalanceArgs {
    walletId: string;
}

export interface GetRecentTransactionsArgs {
    walletId: string;
    limit?: number;
}

export interface CreateTransferTonTransactionArgs {
    walletId: string;
    recipientAddress: string;
    transferAmount: string;
    comment?: string;
    body?: string;
    stateInit?: string;
}

export interface MultiTransferMessage {
    recipientAddress: string;
    transferAmount: string;
    comment?: string;
    body?: string;
    stateInit?: string;
}

export interface CreateTransferMultiTonTransactionArgs {
    walletId: string;
    messages: MultiTransferMessage[];
}

export interface TransactionContentArgs {
    walletId: string;
    transactionContent: TransactionRequest | string; // Can be object (from Kotlin) or string (legacy)
}

export interface TonConnectRequestEvent extends BridgeEvent {
    wallet?: Wallet;
    request?: BridgeEvent & { from?: string };
    preview?: ConnectionRequestEventPreview;
    dAppInfo?: DAppInfo;
    domain?: string;
    isJsBridge?: boolean;
    tabId?: string;
    messageId?: string;
}

export interface ApproveConnectRequestArgs {
    event: TonConnectRequestEvent;
    response?: {
        proof: {
            signature: string;
            timestamp: number;
            domain: {
                lengthBytes: number;
                value: string;
            };
            payload: string;
        };
    };
}

export interface RejectConnectRequestArgs {
    event: TonConnectRequestEvent;
    reason?: string;
    errorCode?: number;
}

export interface ApproveTransactionRequestArgs {
    event: TonConnectRequestEvent;
    response?: {
        signedBoc: string;
    };
}

export interface RejectTransactionRequestArgs {
    event: TonConnectRequestEvent;
    reason?: string | { code: number; message: string };
}

export interface ApproveSignDataRequestArgs {
    event: TonConnectRequestEvent;
    response?: {
        signature: string;
        timestamp: number;
        domain: string;
    };
}

export interface RejectSignDataRequestArgs {
    event: TonConnectRequestEvent;
    reason?: string;
}

export interface DisconnectSessionArgs {
    sessionId?: string;
}

export interface GetNftsArgs {
    walletId: string;
    pagination?: { limit?: number; offset?: number };
    collectionAddress?: string;
    indirectOwnership?: boolean;
}

export interface GetNftArgs {
    walletId: string;
    nftAddress: string;
}

export interface CreateTransferNftTransactionArgs {
    walletId: string;
    nftAddress: string;
    transferAmount?: string;
    recipientAddress: string;
    comment?: string;
}

export interface CreateTransferNftRawTransactionArgs {
    walletId: string;
    nftAddress: string;
    transferAmount: string;
    message: TransactionRequest;
}

export interface GetJettonsArgs {
    walletId: string;
    pagination?: { limit?: number; offset?: number };
}

export interface CreateTransferJettonTransactionArgs {
    walletId: string;
    jettonAddress: string;
    transferAmount: string;
    recipientAddress: string;
    comment?: string;
}

export interface GetJettonBalanceArgs {
    walletId: string;
    jettonAddress: string;
}

export interface GetJettonWalletAddressArgs {
    walletId: string;
    jettonAddress: string;
}

export interface ProcessInternalBrowserRequestArgs {
    messageId: string;
    method: string;
    params?: Record<string, unknown>;
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

export interface HandleTonConnectUrlArgs {
    url: string;
}

// === Intent Args ===

export interface HandleIntentUrlArgs {
    url: string;
    walletId: string;
}

export interface IsIntentUrlArgs {
    url: string;
}

export interface ApproveTransactionIntentArgs {
    event: TransactionIntentRequestEvent;
    walletId: string;
}

export interface ApproveSignDataIntentArgs {
    event: SignDataIntentRequestEvent;
    walletId: string;
}

export interface ApproveActionIntentArgs {
    event: ActionIntentRequestEvent;
    walletId: string;
}

export interface ApproveBatchedIntentArgs {
    batch: BatchedIntentEvent;
    walletId: string;
}

export interface RejectIntentArgs {
    event: IntentRequestEvent | BatchedIntentEvent;
    reason?: string;
    errorCode?: number;
}

export interface IntentItemsToTransactionRequestArgs {
    items: IntentActionItem[];
    walletId: string;
}

export interface ProcessConnectAfterIntentArgs {
    event: IntentRequestEvent | BatchedIntentEvent;
    walletId: string;
    proof?: ConnectionApprovalProof;
}

export interface WalletDescriptor {
    address: string;
    publicKey: string;
    version: string;
    index: number;
    network: string;
}

export interface WalletKitBridgeApi {
    init(config?: WalletKitBridgeInitConfig): PromiseOrValue<{ ok: true }>;
    setEventsListeners(args?: SetEventsListenersArgs): PromiseOrValue<{ ok: true }>;
    removeEventListeners(): PromiseOrValue<{ ok: true }>;
    mnemonicToKeyPair(args: MnemonicToKeyPairArgs): PromiseOrValue<{ publicKey: Uint8Array; secretKey: Uint8Array }>;
    sign(args: SignArgs): PromiseOrValue<string>;
    createTonMnemonic(args?: CreateTonMnemonicArgs): PromiseOrValue<string[]>;
    createSignerFromMnemonic(
        args: CreateSignerFromMnemonicArgs,
    ): PromiseOrValue<{ signerId: string; publicKey: string }>;
    createSignerFromPrivateKey(
        args: CreateSignerFromPrivateKeyArgs,
    ): PromiseOrValue<{ signerId: string; publicKey: string }>;
    createSignerFromCustom(args: CreateSignerFromCustomArgs): PromiseOrValue<{ signerId: string; publicKey: string }>;
    createV5R1WalletAdapter(args: CreateWalletAdapterArgs): PromiseOrValue<{ adapterId: string; address: string }>;
    createV4R2WalletAdapter(args: CreateWalletAdapterArgs): PromiseOrValue<{ adapterId: string; address: string }>;
    addWallet(args: AddWalletArgs): PromiseOrValue<{ walletId: string | undefined; wallet: Wallet } | null>;
    releaseRef(args: ReleaseRefArgs): PromiseOrValue<{ ok: boolean }>;
    getWallets(): PromiseOrValue<{ walletId: string | undefined; wallet: Wallet }[]>;
    getWallet(args: { walletId: string }): PromiseOrValue<{ walletId: string | undefined; wallet: Wallet } | null>;
    getWalletAddress(args: { walletId: string }): PromiseOrValue<string | null>;
    removeWallet(args: RemoveWalletArgs): PromiseOrValue<void>;
    getBalance(args: GetBalanceArgs): PromiseOrValue<string | undefined>;
    getRecentTransactions(args: GetRecentTransactionsArgs): PromiseOrValue<Transaction[]>;
    handleTonConnectUrl(args: HandleTonConnectUrlArgs): PromiseOrValue<void>;
    createTransferTonTransaction(args: CreateTransferTonTransactionArgs): PromiseOrValue<TransactionRequest>;
    createTransferMultiTonTransaction(args: CreateTransferMultiTonTransactionArgs): PromiseOrValue<TransactionRequest>;
    getTransactionPreview(args: TransactionContentArgs): PromiseOrValue<TransactionEmulatedPreview>;
    handleNewTransaction(args: TransactionContentArgs): PromiseOrValue<{ success: boolean }>;
    sendTransaction(args: TransactionContentArgs): PromiseOrValue<SendTransactionResponse>;
    approveConnectRequest(args: ApproveConnectRequestArgs): PromiseOrValue<void>;
    rejectConnectRequest(args: RejectConnectRequestArgs): PromiseOrValue<{ success: boolean }>;
    approveTransactionRequest(args: ApproveTransactionRequestArgs): PromiseOrValue<{ signedBoc: string }>;
    rejectTransactionRequest(args: RejectTransactionRequestArgs): PromiseOrValue<{ success: boolean }>;
    approveSignDataRequest(args: ApproveSignDataRequestArgs): PromiseOrValue<{ signature: string; timestamp: number }>;
    rejectSignDataRequest(args: RejectSignDataRequestArgs): PromiseOrValue<{ success: boolean }>;
    listSessions(): PromiseOrValue<{ items: TONConnectSession[] }>;
    disconnectSession(args?: DisconnectSessionArgs): PromiseOrValue<{ ok: boolean }>;
    getNfts(args: GetNftsArgs): PromiseOrValue<NFTsResponse>;
    getNft(args: GetNftArgs): PromiseOrValue<NFT | null>;
    createTransferNftTransaction(args: CreateTransferNftTransactionArgs): PromiseOrValue<TransactionRequest>;
    createTransferNftRawTransaction(args: CreateTransferNftRawTransactionArgs): PromiseOrValue<TransactionRequest>;
    getJettons(args: GetJettonsArgs): PromiseOrValue<JettonsResponse>;
    createTransferJettonTransaction(args: CreateTransferJettonTransactionArgs): PromiseOrValue<TransactionRequest>;
    getJettonBalance(args: GetJettonBalanceArgs): PromiseOrValue<string>;
    getJettonWalletAddress(args: GetJettonWalletAddressArgs): PromiseOrValue<string>;
    processInternalBrowserRequest(args: ProcessInternalBrowserRequestArgs): PromiseOrValue<TonConnectEventPayload>;
    emitBrowserPageStarted(args: EmitBrowserPageArgs): PromiseOrValue<{ success: boolean }>;
    emitBrowserPageFinished(args: EmitBrowserPageArgs): PromiseOrValue<{ success: boolean }>;
    emitBrowserError(args: EmitBrowserErrorArgs): PromiseOrValue<{ success: boolean }>;
    emitBrowserBridgeRequest(args: EmitBrowserBridgeRequestArgs): PromiseOrValue<{ success: boolean }>;
    // Intent API
    isIntentUrl(args: IsIntentUrlArgs): PromiseOrValue<boolean>;
    handleIntentUrl(args: HandleIntentUrlArgs): PromiseOrValue<void>;
    approveTransactionIntent(args: ApproveTransactionIntentArgs): PromiseOrValue<IntentTransactionResponse>;
    approveSignDataIntent(args: ApproveSignDataIntentArgs): PromiseOrValue<IntentSignDataResponse>;
    approveActionIntent(
        args: ApproveActionIntentArgs,
    ): PromiseOrValue<IntentTransactionResponse | IntentSignDataResponse>;
    approveBatchedIntent(args: ApproveBatchedIntentArgs): PromiseOrValue<IntentTransactionResponse>;
    rejectIntent(args: RejectIntentArgs): PromiseOrValue<IntentErrorResponse>;
    intentItemsToTransactionRequest(args: IntentItemsToTransactionRequestArgs): PromiseOrValue<TransactionRequest>;
    processConnectAfterIntent(args: ProcessConnectAfterIntentArgs): PromiseOrValue<void>;
}
