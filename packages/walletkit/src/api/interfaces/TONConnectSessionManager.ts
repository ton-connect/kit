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
     * Create a new session
     * @param sessionId - Unique session identifier
     * @param dAppInfo - Information about the dApp (name, url, iconUrl, description)
     * @param wallet - The wallet to associate with this session (optional for connect requests before wallet selection)
     * @param options - Additional options for session creation
     */
    createSession(
        sessionId: string,
        dAppInfo: DAppInfo,
        wallet?: Wallet,
        options?: { disablePersist?: boolean; isJsBridge?: boolean },
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
    getSessions(): TONConnectSession[];

    /**
     * Get sessions for specific wallet by wallet ID
     * @param walletId - The wallet ID to filter by
     */
    getSessionsForWallet(walletId: WalletId): TONConnectSession[];

    /**
     * Remove session by ID
     * @param sessionId - The session ID to remove
     * @returns true if the session was removed, false otherwise
     */
    removeSession(sessionId: string): Promise<boolean>;

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
