// Session tracking and lifecycle management

import { SessionCrypto } from '@tonconnect/protocol';

import type { WalletInterface } from '../types';
import type { WalletManager } from '../core/WalletManager';
import type { SessionData, SessionStorageData, StorageAdapter } from '../types/internal';
import { globalLogger } from './Logger';

const log = globalLogger.createChild('SessionManager');

export class SessionManager {
    private sessions: Map<string, SessionStorageData> = new Map();
    private storageAdapter: StorageAdapter;
    private walletManager: WalletManager;
    private storageKey = 'sessions';

    constructor(storageAdapter: StorageAdapter, walletManager: WalletManager) {
        this.storageAdapter = storageAdapter;
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
        wallet: WalletInterface,
    ): Promise<SessionData> {
        const now = new Date();
        // const randomKeyPair = keyPairFromSeed(Buffer.from(crypto.getRandomValues(new Uint8Array(32))));
        const randomKeyPair = new SessionCrypto().stringifyKeypair();
        const sessionData: SessionStorageData = {
            sessionId,
            dAppName,
            domain,
            walletAddress: wallet.getAddress(),
            createdAt: now.toISOString(),
            lastActivityAt: now.toISOString(),
            privateKey: randomKeyPair.secretKey,
            publicKey: randomKeyPair.publicKey,
        };

        this.sessions.set(sessionId, sessionData);
        await this.persistSessions();

        return (await this.getSession(sessionId))!;
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
                wallet: this.walletManager.getWallet(session.walletAddress),
                privateKey: session.privateKey,
                publicKey: session.publicKey,
                createdAt: new Date(session.createdAt),
                lastActivityAt: new Date(session.lastActivityAt),
                domain: session.domain,
            };
        }
        return undefined;
    }

    async getSessionByDomain(domain: string): Promise<SessionData | undefined> {
        // const session = this.sessions(domain);
        // if (session) {
        //     return this.getSession(session.sessionId);
        // }
        for (const session of this.sessions.values()) {
            if (session.domain === domain) {
                return this.getSession(session.sessionId);
            }
        }
        return undefined;
    }

    /**
     * Get all sessions as array
     */
    getSessions(): SessionStorageData[] {
        return Array.from(this.sessions.values());
    }

    /**
     * Get sessions for specific wallet
     */
    getSessionsForWallet(wallet: WalletInterface): SessionStorageData[] {
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
    async removeSessionsForWallet(wallet: WalletInterface): Promise<number> {
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
    getSessionsForAPI(): Array<{ sessionId: string; dAppName: string; walletAddress: string }> {
        return this.getSessions().map((session) => ({
            sessionId: session.sessionId,
            dAppName: session.dAppName,
            walletAddress: session.walletAddress,
        }));
    }

    /**
     * Load sessions from storage
     */
    private async loadSessions(): Promise<void> {
        try {
            const sessionData = await this.storageAdapter.get<SessionStorageData[]>(this.storageKey);

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
            const sessionMetadata: SessionStorageData[] = this.getSessions().map((session) => ({
                sessionId: session.sessionId,
                dAppName: session.dAppName,
                domain: session.domain,
                walletAddress: session.walletAddress,
                createdAt: session.createdAt,
                lastActivityAt: session.lastActivityAt,
                privateKey: session.privateKey,
                publicKey: session.publicKey,
            }));

            await this.storageAdapter.set(this.storageKey, sessionMetadata);
        } catch (error) {
            log.warn('Failed to persist sessions to storage', { error });
        }
    }
}
