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
    UserFriendlyAddress,
    TransactionRequestEvent,
    RequestErrorEvent,
    DisconnectionEvent,
    SignDataRequestEvent,
    ConnectionRequestEvent,
    TransactionApprovalResponse,
    SignDataApprovalResponse,
} from '../api/models';
import type { SwapAPI } from '../defi/swap';

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

    /** Get wallet by address and network */
    getWalletByAddressAndNetwork(address: UserFriendlyAddress, network: Network): Wallet | undefined;

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
    listSessions(): Promise<SessionInfo[]>;

    // === URL Processing ===

    /** Handle pasted TON Connect URL/link */
    handleTonConnectUrl(url: string): Promise<void>;

    /** Handle new transaction */
    handleNewTransaction(wallet: Wallet, data: TransactionRequest): Promise<void>;

    // === Request Processing ===

    /** Approve a connect request */
    approveConnectRequest(event: ConnectionRequestEvent): Promise<void>;
    /** Reject a connect request */
    rejectConnectRequest(
        event: ConnectionRequestEvent,
        reason?: string,
        errorCode?: CONNECT_EVENT_ERROR_CODES,
    ): Promise<void>;

    /** Approve a transaction request */
    approveTransactionRequest(event: TransactionRequestEvent): Promise<TransactionApprovalResponse>;

    /** Reject a transaction request */
    rejectTransactionRequest(
        event: TransactionRequestEvent,
        reason?: string | SendTransactionRpcResponseError['error'],
    ): Promise<void>;

    /** Approve a sign data request */
    approveSignDataRequest(event: SignDataRequestEvent): Promise<SignDataApprovalResponse>;

    /** Reject a sign data request */
    rejectSignDataRequest(event: SignDataRequestEvent, reason?: string): Promise<void>;

    // === Event Handlers ===

    /** Register connect request handler */
    onConnectRequest(cb: (event: ConnectionRequestEvent) => void): void;

    /** Register transaction request handler */
    onTransactionRequest(cb: (event: TransactionRequestEvent) => void): void;

    /** Register sign data request handler */
    onSignDataRequest(cb: (event: SignDataRequestEvent) => void): void;

    /** Register disconnect handler */
    onDisconnect(cb: (event: DisconnectionEvent) => void): void;

    /** Register error handler */
    onRequestError(cb: (event: RequestErrorEvent) => void): void;

    /** Remove request handlers */
    removeConnectRequestCallback(cb: (event: ConnectionRequestEvent) => void): void;
    removeTransactionRequestCallback(cb: (event: TransactionRequestEvent) => void): void;
    removeSignDataRequestCallback(cb: (event: SignDataRequestEvent) => void): void;
    removeDisconnectCallback(cb: (event: DisconnectionEvent) => void): void;
    removeErrorCallback(cb: (event: RequestErrorEvent) => void): void;

    // === Jettons API ===

    /** Jettons API access */
    jettons: JettonsAPI;

    // === Swaps API ===

    /** Jettons API access */
    swap: SwapAPI;
}

/**
 * Session information for API responses
 */
export interface SessionInfo {
    /** Unique session identifier */
    sessionId: string;

    /** Connected dApp name */
    dAppName: string;

    /** Connected dApp URL */
    dAppUrl: string;

    /** Connected dApp icon URL */
    dAppIconUrl: string;

    /** Wallet ID */
    walletId: string;

    /** Session creation time */
    createdAt?: Date;

    /** Last activity time */
    lastActivity?: Date;
}
