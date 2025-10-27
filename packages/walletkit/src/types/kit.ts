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
    /** Get the API client */
    getApiClient(): ApiClient;

    getNetwork(): CHAIN;

    isReady(): boolean;

    // === Wallet Management ===

    /** Get all registered wallets */
    getWallets(): IWallet[];

    /** Get wallet by address */
    getWallet(address: string): IWallet | undefined;

    /** Add a new wallet */
    addWallet(adapter: IWalletAdapter): Promise<IWallet | undefined>;

    /** Remove a wallet */
    removeWallet(wallet: IWalletAdapter): Promise<void>;

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
    signDataRequest(event: EventSignDataRequest): Promise<EventSignDataResponse>;

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

    /** Associated wallet */
    walletAddress: string;

    /** Session creation time */
    createdAt?: Date;

    /** Last activity time */
    lastActivity?: Date;
}
