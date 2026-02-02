/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// TONConnect Session Manager abstraction for Dependency Inversion

import type { DAppInfo, TONConnectSession } from '../models';
import type { WalletId } from '../../utils/walletId';
import type { Wallet } from '.';

/**
 * Abstraction for session management in TONConnect protocol.
 * Provides interface for session CRUD operations and lifecycle management.
 */
export interface TONConnectSessionManager {
    /**
     * Initialize the session manager
     * Needed for backward compatibility with existing codebase
     * Used to ensure that sessions are reloaded fro mstorage to local cache in browser extension
     * */
    initialize(): Promise<void>;

    /**
     * Create a new session
     * @param sessionId - Unique session identifier
     * @param dAppInfo - Information about the dApp (name, url, iconUrl, description)
     * @param wallet - The wallet to associate with this session
     * @param options - Additional options for session creation
     */
    createSession(
        sessionId: string,
        dAppInfo: DAppInfo,
        wallet: Wallet,
        isJsBridge: boolean,
    ): Promise<TONConnectSession>;

    /**
     * Get session by ID
     * @param sessionId - The session ID to retrieve
     */
    getSession(sessionId: string): Promise<TONConnectSession | undefined>;

    /**
     * Get session by domain
     * @param domain - The domain to search for
     */
    getSessionByDomain(domain: string): Promise<TONConnectSession | undefined>;

    /**
     * Get all sessions as array
     */
    getSessions(): Promise<TONConnectSession[]>;

    /**
     * Get sessions for specific wallet by wallet ID
     * @param walletId - The wallet ID to filter by
     */
    getSessionsForWallet(walletId: WalletId): Promise<TONConnectSession[]>;

    /**
     * Remove session by ID
     * @param sessionId - The session ID to remove
     */
    removeSession(sessionId: string): Promise<void>;

    /**
     * Remove all sessions for a wallet by wallet ID
     * @param walletId - Wallet ID string
     */
    removeSessionsForWallet(walletId: WalletId): Promise<void>;

    /**
     * Clear all sessions
     */
    clearSessions(): Promise<void>;
}
