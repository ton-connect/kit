/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Session tracking and lifecycle management

import { SessionCrypto } from '@tonconnect/protocol';

import type { SessionInfo, IWallet } from '../types';
import type { WalletManager } from '../core/WalletManager';
import type { SessionData } from '../types/internal';
import { Storage } from '../storage';
import { globalLogger } from './Logger';
import { IWalletAdapter } from '../types/wallet';

const log = globalLogger.createChild('SessionManager');

export class SessionManager {
    private sessions: Map<string, SessionData> = new Map();
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
     */
    async createSession(
        sessionId: string,
        dAppName: string,
        domain: string,
        dAppIconUrl: string,
        dAppDescription: string,
        wallet?: IWallet,
        { disablePersist = false, isJsBridge = false }: { disablePersist?: boolean; isJsBridge?: boolean } = {},
    ): Promise<SessionData> {
        const now = new Date();
        // const randomKeyPair = keyPairFromSeed(Buffer.from(crypto.getRandomValues(new Uint8Array(32))));
        const randomKeyPair = new SessionCrypto().stringifyKeypair();
        const sessionData: SessionData = {
            sessionId,
            dAppName,
            domain,
            walletAddress: wallet?.getAddress() ?? '',
            createdAt: now.toISOString(),
            lastActivityAt: now.toISOString(),
            privateKey: randomKeyPair.secretKey,
            publicKey: randomKeyPair.publicKey,
            dAppIconUrl: dAppIconUrl,
            dAppDescription: dAppDescription,
            isJsBridge,
        };

        if (disablePersist) {
            return SessionManager.toSessionData(sessionData);
        }
        this.sessions.set(sessionId, sessionData);
        await this.persistSessions();

        return (await this.getSession(sessionId))!;
    }

    static toSessionData(session: SessionData): SessionData {
        return {
            sessionId: session.sessionId,
            dAppName: session.dAppName,
            walletAddress: session.walletAddress,
            // wallet: thiscc.walletManager.getWallet(session.walletAddress),
            privateKey: session.privateKey,
            publicKey: session.publicKey,
            createdAt: session.createdAt,
            lastActivityAt: session.lastActivityAt,
            domain: session.domain,
            dAppIconUrl: session.dAppIconUrl,
            dAppDescription: session.dAppDescription,
            isJsBridge: session.isJsBridge,
        };
    }

    // async getSessionData(sessionId: string): Promise<SessionData | undefined> {}

    /**
     * Get session by ID
     */
    async getSession(sessionId: string): Promise<SessionData | undefined> {
        const session = this.sessions.get(sessionId);
        if (session) {
            return {
                sessionId: session.sessionId,
                dAppName: session.dAppName,
                walletAddress: session.walletAddress,
                privateKey: session.privateKey,
                publicKey: session.publicKey,
                createdAt: session.createdAt,
                lastActivityAt: session.lastActivityAt,
                domain: session.domain,
                dAppIconUrl: session.dAppIconUrl,
                dAppDescription: session.dAppDescription,
                isJsBridge: session.isJsBridge,
            };
        }
        return undefined;
    }

    async getSessionByDomain(domain: string): Promise<SessionData | undefined> {
        // const session = this.sessions(domain);
        // if (session) {
        //     return this.getSession(session.sessionId);
        // }
        let host;
        try {
            host = new URL(domain).host;
        } catch {
            return undefined;
        }
        for (const session of this.sessions.values()) {
            if (session.domain === host) {
                return this.getSession(session.sessionId);
            }
        }
        return undefined;
    }

    /**
     * Get all sessions as array
     */
    getSessions(): SessionData[] {
        return Array.from(this.sessions.values());
    }

    /**
     * Get sessions for specific wallet
     */
    getSessionsForWallet(wallet: IWalletAdapter): SessionData[] {
        return this.getSessions().filter((session) => session.walletAddress === wallet.getAddress());
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
     * Remove all sessions for a wallet
     */
    async removeSessionsForWallet(wallet: IWalletAdapter): Promise<number> {
        const sessionsToRemove = this.getSessionsForWallet(wallet);

        let removedCount = 0;
        for (const session of sessionsToRemove) {
            if (this.sessions.delete(session.sessionId)) {
                removedCount++;
            }
        }

        if (removedCount > 0) {
            await this.persistSessions();
        }

        return removedCount;
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
     * Get sessions as the format expected by the main API
     */
    getSessionsForAPI(): Array<SessionInfo> {
        return this.getSessions().map((session) => ({
            sessionId: session.sessionId,
            dAppName: session.dAppName,
            walletAddress: session.walletAddress,
            dAppUrl: session.domain,
            dAppIconUrl: session.dAppIconUrl,
        }));
    }

    /**
     * Load sessions from storage
     */
    private async loadSessions(): Promise<void> {
        try {
            const sessionData = await this.storage.get<SessionData[]>(this.storageKey);

            if (sessionData && Array.isArray(sessionData)) {
                // TODO: Implement session reconstruction from stored data
                // This is challenging because sessions contain wallet references
                // You'd need to coordinate with WalletManager to reconstruct properly
                for (const session of sessionData) {
                    // const wallet = this.walletManager.getWallet(session.walletAddress);
                    // if (wallet) {
                    this.sessions.set(session.sessionId, {
                        ...session,
                        // wallet,
                        // createdAt: session.createdAt,
                        // lastActivityAt: session.lastActivityAt,
                    });
                    // }
                }
                log.debug('Loaded session metadata', { count: sessionData.length });
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
            // Store session metadata (wallet references need special handling)
            const sessionMetadata: SessionData[] = this.getSessions().map((session) => ({
                sessionId: session.sessionId,
                dAppName: session.dAppName,
                domain: session.domain,
                walletAddress: session.walletAddress,
                createdAt: session.createdAt,
                lastActivityAt: session.lastActivityAt,
                privateKey: session.privateKey,
                publicKey: session.publicKey,
                dAppIconUrl: session.dAppIconUrl,
                dAppDescription: session.dAppDescription,
                isJsBridge: session.isJsBridge,
            }));

            await this.storage.set(this.storageKey, sessionMetadata);
        } catch (error) {
            log.warn('Failed to persist sessions to storage', { error });
        }
    }
}
