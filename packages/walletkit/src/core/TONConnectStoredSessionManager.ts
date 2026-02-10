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
import type { Wallet } from '../api/interfaces';
import type { TONConnectSessionManager } from '../api/interfaces/TONConnectSessionManager';
import type { DAppInfo, TONConnectSession } from '../api/models';

const log = globalLogger.createChild('TONConnectStoredSessionManager');

export class TONConnectStoredSessionManager implements TONConnectSessionManager {
    private sessions: Map<string, TONConnectSession> = new Map();
    private storage: Storage;
    private walletManager: WalletManager;
    private storageKey = 'sessions';

    private schemaVersion = 1;

    constructor(storage: Storage, walletManager: WalletManager) {
        this.storage = storage;
        this.walletManager = walletManager;
    }

    /**
     * Initialize manager and load persisted sessions
     */
    async initialize(): Promise<void> {
        await this.loadSessions();
        await this.migrateSessions();
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
        wallet: Wallet,
        isJsBridge: boolean,
    ): Promise<TONConnectSession> {
        const now = new Date();
        const randomKeyPair = new SessionCrypto().stringifyKeypair();

        // Create walletId from wallet if provided
        const walletId = wallet.getWalletId();

        let domain: string;

        try {
            const url: URL = new URL(dAppInfo.url || '');
            domain = url.host;
        } catch {
            throw new Error('Unable to resolve domain from dApp URL for new sessions');
        }

        const session: TONConnectSession = {
            sessionId,
            walletId,
            walletAddress: wallet?.getAddress() ?? '',
            createdAt: now.toISOString(),
            lastActivityAt: now.toISOString(),
            privateKey: randomKeyPair.secretKey,
            publicKey: randomKeyPair.publicKey,
            domain: domain,
            dAppName: dAppInfo.name,
            dAppDescription: dAppInfo.description,
            dAppUrl: dAppInfo.url,
            dAppIconUrl: dAppInfo.iconUrl,
            isJsBridge,
            schemaVersion: this.schemaVersion,
        };

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

    async getSessions(filter?: {
        walletId?: WalletId;
        domain?: string;
        isJsBridge?: boolean;
    }): Promise<TONConnectSession[]> {
        let sessions = Array.from(this.sessions.values());

        if (!filter) {
            return sessions;
        }

        let domain: string;

        if (filter.domain) {
            try {
                domain = new URL(filter.domain).host;
            } catch {
                domain = filter.domain;
            }
        }
        return sessions.filter((session) => {
            let isIncluded = true;

            if (filter.walletId) {
                isIncluded = isIncluded && session.walletId === filter.walletId;
            }

            if (filter.domain) {
                isIncluded = isIncluded && session.domain === domain;
            }

            if (filter.isJsBridge !== undefined) {
                isIncluded = isIncluded && session.isJsBridge === filter.isJsBridge;
            }

            return isIncluded;
        });
    }

    /**
     * Remove session by ID
     */
    async removeSession(sessionId: string): Promise<void> {
        const removed = this.sessions.delete(sessionId);
        if (removed) {
            await this.persistSessions();
        }
    }

    async removeSessions(filter?: { walletId?: WalletId; domain?: string; isJsBridge?: boolean }): Promise<void> {
        const sessionsToRemove = await this.getSessions(filter);

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

    private async migrateSessions(): Promise<void> {
        for (const [sessionId, session] of this.sessions.entries()) {
            const migratedSession = this.migrate(session);

            if (migratedSession) {
                this.sessions.set(sessionId, migratedSession);
            } else {
                this.sessions.delete(sessionId);
            }
        }

        await this.persistSessions();
    }

    private migrate(session: TONConnectSession): TONConnectSession | undefined {
        if (session.schemaVersion === this.schemaVersion) {
            return session;
        }

        // Currently there is no session versions other that 1, so we just return undefined for all unknown or undefined versions
        return undefined;
    }
}
