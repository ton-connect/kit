/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TONConnectSessionManager, TONConnectSession, DAppInfo, Wallet, WalletId } from '@ton/walletkit';

import { log, warn, error } from '../utils/logger';

/**
 * Native bridge interface for session management.
 * These methods are exposed by Android's WebViewManager as @JavascriptInterface.
 */
interface AndroidSessionBridge {
    hasSessionManager(): boolean;
    sessionCreate(
        sessionId: string,
        dAppInfoJson: string,
        walletId: string,
        walletAddress: string,
        isJsBridge: boolean,
    ): string;
    sessionGet(sessionId: string): string | null;
    sessionGetByDomain(domain: string): string | null;
    sessionGetAll(): string;
    sessionGetForWallet(walletId: string): string;
    sessionRemove(sessionId: string): void;
    sessionRemoveForWallet(walletId: string): void;
    sessionClear(): void;
}

type AndroidWindow = Window & {
    WalletKitNative?: AndroidSessionBridge;
};

/**
 * Checks if the Android native session manager bridge is available.
 * Returns true only if the native side has a session manager configured.
 */
export function hasAndroidSessionManager(): boolean {
    const win = window as AndroidWindow;
    // Check if the bridge exists and has a session manager configured
    // hasSessionManager() returns true only when native side has sessionManager != null
    return win.WalletKitNative?.hasSessionManager?.() === true;
}

/**
 * Android adapter for TONConnect session management.
 * Delegates all session operations to the Kotlin implementation via WebViewManager's JavaScript interface.
 */
export class AndroidTONConnectSessionsManager implements TONConnectSessionManager {
    private bridge: AndroidSessionBridge;

    constructor() {
        const win = window as AndroidWindow;
        if (!win.WalletKitNative?.sessionCreate) {
            throw new Error('Android native session manager bridge not available');
        }
        this.bridge = win.WalletKitNative;
        log('[AndroidSessionManager] Initialized with native bridge');
    }

    async initialize(): Promise<void> {
        // No initialization needed for Android implementation.
        // The Kotlin session manager is already initialized by the time the bridge is created.
        log('[AndroidSessionManager] initialize() called - no-op for Android');
    }

    async createSession(
        sessionId: string,
        dAppInfo: DAppInfo,
        wallet: Wallet,
        isJsBridge: boolean,
    ): Promise<TONConnectSession> {
        try {
            log('[AndroidSessionManager] createSession:', sessionId);

            // Get wallet info - wallet is a JS object from WalletKit
            const walletId = wallet.getWalletId?.() ?? '';
            const walletAddress = wallet.getAddress?.() ?? '';

            const dAppInfoJson = JSON.stringify({
                name: dAppInfo.name,
                url: dAppInfo.url,
                iconUrl: dAppInfo.iconUrl,
                description: dAppInfo.description,
            });

            const resultJson = this.bridge.sessionCreate(sessionId, dAppInfoJson, walletId, walletAddress, isJsBridge);

            const session = JSON.parse(resultJson) as TONConnectSession;
            log('[AndroidSessionManager] Session created:', session.sessionId);
            return session;
        } catch (err) {
            error('[AndroidSessionManager] Failed to create session:', err);
            throw err;
        }
    }

    async getSession(sessionId: string): Promise<TONConnectSession | undefined> {
        try {
            log('[AndroidSessionManager] getSession:', sessionId);
            const resultJson = this.bridge.sessionGet(sessionId);
            if (!resultJson) {
                return undefined;
            }
            return JSON.parse(resultJson) as TONConnectSession;
        } catch (err) {
            warn('[AndroidSessionManager] Failed to get session:', err);
            return undefined;
        }
    }

    async getSessionByDomain(domain: string): Promise<TONConnectSession | undefined> {
        try {
            log('[AndroidSessionManager] getSessionByDomain:', domain);
            const resultJson = this.bridge.sessionGetByDomain(domain);
            if (!resultJson) {
                return undefined;
            }
            return JSON.parse(resultJson) as TONConnectSession;
        } catch (err) {
            warn('[AndroidSessionManager] Failed to get session by domain:', err);
            return undefined;
        }
    }

    async getSessions(): Promise<TONConnectSession[]> {
        try {
            log('[AndroidSessionManager] getSessions');
            const resultJson = this.bridge.sessionGetAll();
            return JSON.parse(resultJson) as TONConnectSession[];
        } catch (err) {
            warn('[AndroidSessionManager] Failed to get sessions:', err);
            return [];
        }
    }

    async getSessionsForWallet(walletId: WalletId): Promise<TONConnectSession[]> {
        try {
            log('[AndroidSessionManager] getSessionsForWallet:', walletId);
            const resultJson = this.bridge.sessionGetForWallet(walletId);
            return JSON.parse(resultJson) as TONConnectSession[];
        } catch (err) {
            warn('[AndroidSessionManager] Failed to get sessions for wallet:', err);
            return [];
        }
    }

    async removeSession(sessionId: string): Promise<void> {
        try {
            log('[AndroidSessionManager] removeSession:', sessionId);
            this.bridge.sessionRemove(sessionId);
        } catch (err) {
            error('[AndroidSessionManager] Failed to remove session:', err);
            throw err;
        }
    }

    async removeSessionsForWallet(walletId: WalletId): Promise<void> {
        try {
            log('[AndroidSessionManager] removeSessionsForWallet:', walletId);
            this.bridge.sessionRemoveForWallet(walletId);
        } catch (err) {
            error('[AndroidSessionManager] Failed to remove sessions for wallet:', err);
            throw err;
        }
    }

    async clearSessions(): Promise<void> {
        try {
            log('[AndroidSessionManager] clearSessions');
            this.bridge.sessionClear();
        } catch (err) {
            error('[AndroidSessionManager] Failed to clear sessions:', err);
            throw err;
        }
    }
}
