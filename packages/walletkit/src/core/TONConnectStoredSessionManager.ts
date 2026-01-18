/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Session tracking and lifecycle management

import { SessionCrypto } from '@tonconnect/protocol';

import type { WalletManager } from '../core/WalletManager';
import type { Storage } from '../storage';
import { globalLogger } from './Logger';
import type { WalletId } from '../utils/walletId';
import { createWalletId } from '../utils/walletId';
import type { Wallet } from '../api/interfaces';
import type { TONConnectSessionManager } from '../api/interfaces/TONConnectSessionManager';
import type { DAppInfo, TONConnectSession } from '../api/models';

const log = globalLogger.createChild('TONConnectStoredSessionManager');

export class TONConnectStoredSessionManager implements TONConnectSessionManager {
    private sessions: Map<string, TONConnectSession> = new Map();
    private storage: Storage;
    private walletManager: WalletManager;
    private storageKey = 'sessions';

    constructor(storage: Storage, walletManager: WalletManager) {
        this.storage = storage;
        this.walletManager = walletManager;
    }

    /**
     * Initialize manager and load persisted sessions
     */
    async initialize(): Promise<void> {
        await this.loadSessions();
    }

    /**
     * Create new session
     * @param sessionId - Unique session identifier
     * @param dAppInfo - Information about the dApp
     * @param wallet - The wallet to associate with this session (optional for connect requests before wallet selection)
     * @param options - Additional options for session creation
     */
    async createSession(
        sessionId: string,
        dAppInfo: DAppInfo,
        wallet?: Wallet,
        { disablePersist = false, isJsBridge = false }: { disablePersist?: boolean; isJsBridge?: boolean } = {},
    ): Promise<TONConnectSession> {
        const now = new Date();
        const randomKeyPair = new SessionCrypto().stringifyKeypair();

        // Create walletId from wallet if provided
        const walletId = wallet ? createWalletId(wallet.getNetwork(), wallet.getAddress()) : '';

        const session: TONConnectSession = {
            sessionId,
            walletId,
            walletAddress: wallet?.getAddress() ?? '',
            createdAt: now.toISOString(),
            lastActivityAt: now.toISOString(),
            privateKey: randomKeyPair.secretKey,
            publicKey: randomKeyPair.publicKey,
            dAppInfo: {
                name: dAppInfo.name ?? '',
                description: dAppInfo.description ?? '',
                url: dAppInfo.url ?? '',
                iconUrl: dAppInfo.iconUrl ?? '',
            },
            isJsBridge,
        };

        if (disablePersist) {
            return session;
        }
        this.sessions.set(sessionId, session);
        await this.persistSessions();

        return (await this.getSession(sessionId))!;
    }

    /**
     * Get session by ID
     */
    async getSession(sessionId: string): Promise<TONConnectSession | undefined> {
        return this.sessions.get(sessionId);
    }

    async getSessionByDomain(domain: string): Promise<TONConnectSession | undefined> {
        let host;
        try {
            host = new URL(domain).host;
        } catch {
            return undefined;
        }
        for (const session of this.sessions.values()) {
            if (session.dAppInfo.url === host) {
                return this.getSession(session.sessionId);
            }
        }
        return undefined;
    }

    /**
     * Get all sessions as array
     */
    getSessions(): TONConnectSession[] {
        return Array.from(this.sessions.values());
    }

    /**
     * Get sessions for specific wallet by wallet ID
     */
    getSessionsForWallet(walletId: WalletId): TONConnectSession[] {
        return this.getSessions().filter((session) => session.walletId === walletId);
    }

    /**
     * Update session activity timestamp
     */
    async updateSessionActivity(sessionId: string): Promise<void> {
        const session = this.sessions.get(sessionId);
        if (session) {
            session.lastActivityAt = new Date().toISOString();
            await this.persistSessions();
        }
    }

    /**
     * Remove session by ID
     */
    async removeSession(sessionId: string): Promise<boolean> {
        const removed = this.sessions.delete(sessionId);
        if (removed) {
            await this.persistSessions();
        }
        return removed;
    }

    /**
     * Remove all sessions for a wallet by wallet ID or wallet adapter
     */
    async removeSessionsForWallet(walletId: WalletId): Promise<void> {
        const sessionsToRemove = this.getSessionsForWallet(walletId);

        let removedCount = 0;
        for (const session of sessionsToRemove) {
            if (this.sessions.delete(session.sessionId)) {
                removedCount++;
            }
        }

        if (removedCount > 0) {
            await this.persistSessions();
        }
    }

    /**
     * Clear all sessions
     */
    async clearSessions(): Promise<void> {
        this.sessions.clear();
        await this.persistSessions();
    }

    /**
     * Get session count
     */
    getSessionCount(): number {
        return this.sessions.size;
    }

    /**
     * Check if session exists
     */
    hasSession(sessionId: string): boolean {
        return this.sessions.has(sessionId);
    }

    /**
     * Clean up expired sessions (optional cleanup based on inactivity)
     */
    async cleanupInactiveSessions(maxInactiveHours: number = 24): Promise<number> {
        const cutoffTime = new Date();
        cutoffTime.setHours(cutoffTime.getHours() - maxInactiveHours);

        const sessionsToRemove: string[] = [];

        for (const [sessionId, session] of this.sessions.entries()) {
            if (new Date(session.lastActivityAt) < cutoffTime) {
                sessionsToRemove.push(sessionId);
            }
        }

        // Remove expired sessions
        for (const sessionId of sessionsToRemove) {
            this.sessions.delete(sessionId);
        }

        if (sessionsToRemove.length > 0) {
            await this.persistSessions();
        }

        return sessionsToRemove.length;
    }

    /**
     * Load sessions from storage
     */
    private async loadSessions(): Promise<void> {
        try {
            const storedSessions = await this.storage.get<TONConnectSession[]>(this.storageKey);

            if (storedSessions && Array.isArray(storedSessions)) {
                for (const session of storedSessions) {
                    if (session.walletId && !session.walletAddress) {
                        const wallet = this.walletManager.getWallet(session.walletId);
                        if (wallet) {
                            session.walletAddress = wallet.getAddress();
                        } else {
                            log.warn('Session Wallet not found for session', { sessionId: session.sessionId });
                            continue;
                        }
                    }
                    this.sessions.set(session.sessionId, session);
                }
                log.debug('Loaded session metadata', { count: storedSessions.length });
            }
        } catch (error) {
            log.warn('Failed to load sessions from storage', { error });
        }
    }

    /**
     * Persist session metadata to storage
     */
    private async persistSessions(): Promise<void> {
        try {
            const sessionsToStore: TONConnectSession[] = Array.from(this.sessions.values());
            await this.storage.set(this.storageKey, sessionsToStore);
        } catch (error) {
            log.warn('Failed to persist sessions to storage', { error });
        }
    }
}
