// Main TonWalletKit interface definition

import type { WalletInterface, WalletInitConfig, WalletInitInterface } from './wallet';
import type {
    EventConnectRequest,
    EventTransactionRequest,
    EventSignDataRequest,
    EventDisconnect,
    EventRequestError,
} from './events';
import type { JettonsAPI } from './jettons';
import { ConnectTransactionParamContent } from './internal';
import { Hash } from './primitive';

/**
 * Main TonWalletKit interface
 *
 * This interface defines the public API for the TonWalletKit.
 * All implementations must conform to this interface.
 */
export interface TonWalletKit {
    // === Wallet Management ===

    /** Get all registered wallets */
    getWallets(): WalletInterface[];

    /** Get wallet by address */
    getWallet(address: string): WalletInterface | undefined;

    /** Add a new wallet */
    addWallet(walletConfig: WalletInitConfig): Promise<WalletInterface | undefined>;

    /** Remove a wallet */
    removeWallet(wallet: WalletInitInterface): Promise<void>;

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
    handleNewTransaction(wallet: WalletInterface, data: ConnectTransactionParamContent): Promise<void>;

    // === Request Processing ===

    /** Approve a connect request */
    approveConnectRequest(event: EventConnectRequest): Promise<void>;

    /** Reject a connect request */
    rejectConnectRequest(event: EventConnectRequest, reason?: string): Promise<void>;

    /** Approve a transaction request */
    approveTransactionRequest(event: EventTransactionRequest): Promise<{ signedBoc: string }>;

    /** Reject a transaction request */
    rejectTransactionRequest(event: EventTransactionRequest, reason?: string): Promise<void>;

    /** Approve a sign data request */
    signDataRequest(event: EventSignDataRequest): Promise<{ signature: Hash }>;

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

    /** Associated wallet */
    walletAddress: string;

    /** Session creation time */
    createdAt?: Date;

    /** Last activity time */
    lastActivity?: Date;
}

/**
 * Kit status information
 */
export interface KitStatus {
    /** Whether kit is initialized */
    initialized: boolean;

    /** Whether kit is ready for use */
    ready: boolean;

    /** Number of registered wallets */
    walletCount: number;

    /** Number of active sessions */
    sessionCount: number;

    /** Bridge connection status */
    bridgeConnected: boolean;
}
