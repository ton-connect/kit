/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Main TonWalletKit interface definition

import type { CONNECT_EVENT_ERROR_CODES, SendTransactionRpcResponseError } from '@tonconnect/protocol';

import type { JettonsAPI } from './jettons';
import type { ApiClient } from './toncenter/ApiClient';
import type { Wallet, WalletAdapter } from '../api/interfaces';
import type { Network } from '../api/models/core/Network';
import type { WalletId } from '../utils/walletId';
import type {
    TransactionRequest,
    SendTransactionRequestEvent,
    RequestErrorEvent,
    DisconnectionEvent,
    SignDataRequestEvent,
    SignMessageRequestEvent,
    ConnectionRequestEvent,
    SignDataApprovalResponse,
    SignMessageApprovalResponse,
    TONConnectSession,
    SendTransactionApprovalResponse,
    ConnectionApprovalResponse,
    IntentRequestEvent,
    TransactionIntentRequestEvent,
    SignDataIntentRequestEvent,
    ActionIntentRequestEvent,
    IntentTransactionResponse,
    IntentSignDataResponse,
    IntentErrorResponse,
    IntentActionItem,
    BatchedIntentEvent,
    ConnectionApprovalProof,
} from '../api/models';
import type { SwapAPI } from '../api/interfaces';

/**
 * Main TonWalletKit interface
 *
 * This interface defines the public API for the TonWalletKit.
 * All implementations must conform to this interface.
 */
export interface ITonWalletKit {
    /**
     * Get API client for a specific network
     * @param network - The network object
     */
    getApiClient(network: Network): ApiClient;

    /** Get all configured networks */
    getConfiguredNetworks(): Network[];

    isReady(): boolean;

    /** Ensure initialization is complete */
    ensureInitialized(): Promise<void>;

    // === Wallet Management ===

    /** Get all registered wallets */
    getWallets(): Wallet[];

    /** Get wallet by wallet ID (network:address format) */
    getWallet(walletId: WalletId): Wallet | undefined;

    /** Add a new wallet, returns wallet ID */
    addWallet(adapter: WalletAdapter): Promise<Wallet | undefined>;

    /** Remove a wallet by wallet ID or adapter */
    removeWallet(walletIdOrAdapter: WalletId | WalletAdapter): Promise<void>;

    /** Clear all wallets */
    clearWallets(): Promise<void>;

    // === Session Management ===

    /** Disconnect session(s) */
    disconnect(sessionId?: string): Promise<void>;

    /** List all active sessions */
    listSessions(): Promise<TONConnectSession[]>;

    // === URL Processing ===

    /** Handle pasted TON Connect URL/link */
    handleTonConnectUrl(url: string): Promise<void>;

    /** Handle new transaction */
    handleNewTransaction(wallet: Wallet, data: TransactionRequest): Promise<void>;

    // === Request Processing ===

    /** Approve a connect request */
    approveConnectRequest(event: ConnectionRequestEvent, response?: ConnectionApprovalResponse): Promise<void>;
    /** Reject a connect request */
    rejectConnectRequest(
        event: ConnectionRequestEvent,
        reason?: string,
        errorCode?: CONNECT_EVENT_ERROR_CODES,
    ): Promise<void>;

    /** Approve a transaction request */
    approveTransactionRequest(
        event: SendTransactionRequestEvent,
        response?: SendTransactionApprovalResponse,
    ): Promise<SendTransactionApprovalResponse>;

    /** Reject a transaction request */
    rejectTransactionRequest(
        event: SendTransactionRequestEvent,
        reason?: string | SendTransactionRpcResponseError['error'],
    ): Promise<void>;

    /** Approve a sign data request */
    approveSignDataRequest(
        event: SignDataRequestEvent,
        response?: SignDataApprovalResponse,
    ): Promise<SignDataApprovalResponse>;

    /** Reject a sign data request */
    rejectSignDataRequest(event: SignDataRequestEvent, reason?: string): Promise<void>;

    /** Approve a sign message (sign-only transaction) request */
    approveSignMessageRequest(
        event: SignMessageRequestEvent,
        response?: SignMessageApprovalResponse,
    ): Promise<SignMessageApprovalResponse>;

    /** Reject a sign message request */
    rejectSignMessageRequest(event: SignMessageRequestEvent, reason?: string): Promise<void>;

    // === Event Handlers ===

    /** Register connect request handler */
    onConnectRequest(cb: (event: ConnectionRequestEvent) => void): void;

    /** Register transaction request handler */
    onTransactionRequest(cb: (event: SendTransactionRequestEvent) => void): void;

    /** Register sign data request handler */
    onSignDataRequest(cb: (event: SignDataRequestEvent) => void): void;

    /** Register sign message request handler */
    onSignMessageRequest(cb: (event: SignMessageRequestEvent) => void): void;

    /** Register disconnect handler */
    onDisconnect(cb: (event: DisconnectionEvent) => void): void;

    /** Register error handler */
    onRequestError(cb: (event: RequestErrorEvent) => void): void;

    /** Remove request handlers */
    removeConnectRequestCallback(cb: (event: ConnectionRequestEvent) => void): void;
    removeTransactionRequestCallback(cb: (event: SendTransactionRequestEvent) => void): void;
    removeSignDataRequestCallback(cb: (event: SignDataRequestEvent) => void): void;
    removeSignMessageRequestCallback(cb: (event: SignMessageRequestEvent) => void): void;
    removeDisconnectCallback(cb: (event: DisconnectionEvent) => void): void;
    removeErrorCallback(cb: (event: RequestErrorEvent) => void): void;

    // === Intent API ===

    /** Check if a URL is a TonConnect intent deep link */
    isIntentUrl(url: string): boolean;

    /** Handle a TonConnect intent URL for the given wallet */
    handleIntentUrl(url: string, walletId: string): Promise<void>;

    /** Register intent request handler */
    onIntentRequest(cb: (event: IntentRequestEvent | BatchedIntentEvent) => void): void;

    /** Remove intent request handler */
    removeIntentRequestCallback(cb: (event: IntentRequestEvent | BatchedIntentEvent) => void): void;

    /** Approve a transaction draft intent */
    approveTransactionDraft(event: TransactionIntentRequestEvent, walletId: string): Promise<IntentTransactionResponse>;

    /** Approve a sign data intent */
    approveSignDataIntent(event: SignDataIntentRequestEvent, walletId: string): Promise<IntentSignDataResponse>;

    /** Approve an action draft intent */
    approveActionDraft(
        event: ActionIntentRequestEvent,
        walletId: string,
    ): Promise<IntentTransactionResponse | IntentSignDataResponse>;

    /** Approve a batched intent (connect + transaction/signData/action) */
    approveBatchedIntent(
        batch: BatchedIntentEvent,
        walletId: string,
        proof?: ConnectionApprovalProof,
    ): Promise<IntentTransactionResponse | IntentSignDataResponse>;

    /** Reject any intent request */
    rejectIntent(
        event: IntentRequestEvent | BatchedIntentEvent,
        reason?: string,
        errorCode?: number,
    ): Promise<IntentErrorResponse>;

    /** Convert intent action items to a TransactionRequest for preview */
    intentItemsToTransactionRequest(items: IntentActionItem[], walletId: string): Promise<TransactionRequest>;

    // === Jettons API ===

    /** Jettons API access */
    jettons: JettonsAPI;

    // === Swaps API ===

    /** Jettons API access */
    swap: SwapAPI;
}
