/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Main TonWalletKit interface definition

import { CHAIN, CONNECT_EVENT_ERROR_CODES, SendTransactionRpcResponseError } from '@tonconnect/protocol';

import type { IWallet, IWalletAdapter } from './wallet';
import type {
    EventConnectRequest,
    EventTransactionRequest,
    EventSignDataRequest,
    EventDisconnect,
    EventRequestError,
    EventSignDataResponse,
    EventTransactionResponse,
} from './events';
import type { JettonsAPI } from './jettons';
import { ConnectTransactionParamContent } from './internal';
import { ApiClient } from './toncenter/ApiClient';

/**
 * Main TonWalletKit interface
 *
 * This interface defines the public API for the TonWalletKit.
 * All implementations must conform to this interface.
 */
export interface ITonWalletKit {
    /**
     * Get API client for a specific network
     * @param chainId - The chain ID (CHAIN.MAINNET or CHAIN.TESTNET)
     */
    getApiClient(chainId: CHAIN): ApiClient;

    /** Get all configured networks */
    getConfiguredNetworks(): CHAIN[];

    isReady(): boolean;

    // === Wallet Management ===

    /** Get all registered wallets */
    getWallets(): IWallet[];

    /** Get wallet by wallet ID (network:address format) */
    getWallet(walletId: string): IWallet | undefined;

    /** Get wallet by address and network */
    getWalletByAddressAndNetwork(address: string, network: CHAIN): IWallet | undefined;

    /** Add a new wallet, returns wallet ID */
    addWallet(adapter: IWalletAdapter): Promise<IWallet | undefined>;

    /** Remove a wallet by wallet ID or adapter */
    removeWallet(walletIdOrAdapter: string | IWalletAdapter): Promise<void>;

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
    handleNewTransaction(wallet: IWallet, data: ConnectTransactionParamContent): Promise<void>;

    // === Request Processing ===

    /** Approve a connect request */
    approveConnectRequest(event: EventConnectRequest): Promise<void>;
    /** Reject a connect request */
    rejectConnectRequest(
        event: EventConnectRequest,
        reason?: string,
        errorCode?: CONNECT_EVENT_ERROR_CODES,
    ): Promise<void>;

    /** Approve a transaction request */
    approveTransactionRequest(event: EventTransactionRequest): Promise<EventTransactionResponse>;

    /** Reject a transaction request */
    rejectTransactionRequest(
        event: EventTransactionRequest,
        reason?: string | SendTransactionRpcResponseError['error'],
    ): Promise<void>;

    /** Approve a sign data request */
    approveSignDataRequest(event: EventSignDataRequest): Promise<EventSignDataResponse>;

    /** Reject a sign data request */
    rejectSignDataRequest(event: EventSignDataRequest, reason?: string): Promise<void>;

    // === Event Handlers ===

    /** Register connect request handler */
    onConnectRequest(cb: (event: EventConnectRequest) => void): void;

    /** Register transaction request handler */
    onTransactionRequest(cb: (event: EventTransactionRequest) => void): void;

    /** Register sign data request handler */
    onSignDataRequest(cb: (event: EventSignDataRequest) => void): void;

    /** Register disconnect handler */
    onDisconnect(cb: (event: EventDisconnect) => void): void;

    /** Register error handler */
    onRequestError(cb: (event: EventRequestError) => void): void;

    /** Remove request handlers */
    removeConnectRequestCallback(cb: (event: EventConnectRequest) => void): void;
    removeTransactionRequestCallback(cb: (event: EventTransactionRequest) => void): void;
    removeSignDataRequestCallback(cb: (event: EventSignDataRequest) => void): void;
    removeDisconnectCallback(cb: (event: EventDisconnect) => void): void;
    removeErrorCallback(cb: (event: EventRequestError) => void): void;

    // === Jettons API ===

    /** Jettons API access */
    jettons: JettonsAPI;
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
