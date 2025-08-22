// Main TonWalletKit interface definition

import type { WalletInterface, WalletInitConfig } from './wallet';
import type { EventConnectRequest, EventTransactionRequest, EventSignDataRequest, EventDisconnect } from './events';
import type { JettonInfo } from '../core/JettonsManager';

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
    addWallet(walletConfig: WalletInitConfig): Promise<void>;

    /** Remove a wallet */
    removeWallet(wallet: WalletInterface): Promise<void>;

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
    signDataRequest(event: EventSignDataRequest): Promise<{ signature: Uint8Array }>;

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

    // === Jettons API ===

    /** Jettons API access */
    jettons: {
        /** Get jetton information by address */
        getJettonInfo(jettonAddress: string): JettonInfo | null;

        /** Get jettons for a specific user address */
        getAddressJettons(userAddress: string, offset?: number, limit?: number): Promise<JettonInfo[]>;
    };
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
