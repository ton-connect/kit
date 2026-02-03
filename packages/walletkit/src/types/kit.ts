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
import type { IntentEvent, TransactionIntentEvent } from './intents';
import type { Network } from '../api/models/core/Network';
import type { WalletId } from '../utils/walletId';
import type {
    TransactionRequest,
    SendTransactionRequestEvent,
    RequestErrorEvent,
    DisconnectionEvent,
    SignDataRequestEvent,
    ConnectionRequestEvent,
    SignDataApprovalResponse,
    TONConnectSession,
    SendTransactionApprovalResponse,
    ConnectionApprovalResponse,
} from '../api/models';

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

    /** Handle intent URL (tc://intent_inline?...) */
    handleIntentUrl(url: string): Promise<void>;

    /** Check if URL is an intent URL */
    isIntentUrl(url: string): boolean;

    /** Handle new transaction */
    handleNewTransaction(wallet: Wallet, data: TransactionRequest): Promise<void>;

    /** Convert intent items to transaction request */
    intentItemsToTransactionRequest(event: TransactionIntentEvent, wallet: Wallet): Promise<TransactionRequest>;

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

    // === Event Handlers ===

    /** Register connect request handler */
    onConnectRequest(cb: (event: ConnectionRequestEvent) => void): void;

    /** Register transaction request handler */
    onTransactionRequest(cb: (event: SendTransactionRequestEvent) => void): void;

    /** Register sign data request handler */
    onSignDataRequest(cb: (event: SignDataRequestEvent) => void): void;

    /** Register disconnect handler */
    onDisconnect(cb: (event: DisconnectionEvent) => void): void;

    /** Register error handler */
    onRequestError(cb: (event: RequestErrorEvent) => void): void;

    /** Register intent request handler */
    onIntentRequest(cb: (event: IntentEvent) => void): void;

    /** Remove request handlers */
    removeConnectRequestCallback(cb: (event: ConnectionRequestEvent) => void): void;
    removeTransactionRequestCallback(cb: (event: SendTransactionRequestEvent) => void): void;
    removeSignDataRequestCallback(cb: (event: SignDataRequestEvent) => void): void;
    removeDisconnectCallback(cb: (event: DisconnectionEvent) => void): void;
    removeErrorCallback(cb: (event: RequestErrorEvent) => void): void;

    // === Jettons API ===

    /** Jettons API access */
    jettons: JettonsAPI;
}
