/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TONConnectSessionManager, TONConnectSession, DAppInfo, Wallet, WalletId } from '@ton/walletkit';

import { warn, error } from '../utils/logger';

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
    sessionGetFiltered(filterJson: string): string;
    sessionRemove(sessionId: string): string | null;
    sessionRemoveFiltered(filterJson: string): string;
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
    }

    async initialize(): Promise<void> {
        // No initialization needed - Kotlin session manager is already initialized
    }

    async createSession(
        sessionId: string,
        dAppInfo: DAppInfo,
        wallet: Wallet,
        isJsBridge: boolean,
    ): Promise<TONConnectSession> {
        try {
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
            return session;
        } catch (err) {
            error('[AndroidSessionManager] Failed to create session:', err);
            throw err;
        }
    }

    async getSession(sessionId: string): Promise<TONConnectSession | undefined> {
        try {
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

    async getSessions(parameters?: {
        walletId?: WalletId;
        domain?: string;
        isJsBridge?: boolean;
    }): Promise<TONConnectSession[]> {
        try {
            const filterJson = JSON.stringify(parameters ?? {});
            const resultJson = this.bridge.sessionGetFiltered(filterJson);
            return JSON.parse(resultJson) as TONConnectSession[];
        } catch (err) {
            warn('[AndroidSessionManager] Failed to get sessions:', err);
            return [];
        }
    }

    async removeSession(sessionId: string): Promise<void> {
        try {
            this.bridge.sessionRemove(sessionId);
        } catch (err) {
            error('[AndroidSessionManager] Failed to remove session:', err);
            throw err;
        }
    }

    async removeSessions(parameters?: { walletId?: WalletId; domain?: string; isJsBridge?: boolean }): Promise<void> {
        try {
            const filterJson = JSON.stringify(parameters ?? {});
            this.bridge.sessionRemoveFiltered(filterJson);
        } catch (err) {
            error('[AndroidSessionManager] Failed to remove sessions:', err);
            throw err;
        }
    }

    async clearSessions(): Promise<void> {
        try {
            this.bridge.sessionClear();
        } catch (err) {
            error('[AndroidSessionManager] Failed to clear sessions:', err);
            throw err;
        }
    }
}
