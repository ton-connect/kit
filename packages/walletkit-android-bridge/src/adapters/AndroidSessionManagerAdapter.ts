/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { DAppInfo, Wallet } from '@ton/walletkit';
import type { WalletId } from '@ton/walletkit';
import type { TONConnectSession, TONConnectSessionManager } from '@ton/walletkit';

import { error } from '../utils/logger';

type AndroidSessionBridge = {
    sessionCreate: (
        sessionId: string,
        dAppInfoJson: string,
        walletId: string,
        walletAddress: string,
        isJsBridge: boolean,
    ) => string; // Returns JSON-encoded TONConnectSession
    sessionGet: (sessionId: string) => string | null; // Returns JSON-encoded TONConnectSession or null
    sessionGetByDomain: (domain: string) => string | null; // Returns JSON-encoded TONConnectSession or null
    sessionGetAll: () => string; // Returns JSON-encoded array of TONConnectSession
    sessionGetForWallet: (walletId: string) => string; // Returns JSON-encoded array of TONConnectSession
    sessionRemove: (sessionId: string) => void;
    sessionRemoveForWallet: (walletId: string) => void;
    sessionClear: () => void;
};

type AndroidWindow = Window & {
    WalletKitNative?: AndroidSessionBridge;
};

/**
 * Returns true if the native session manager bridge is available.
 * This indicates that the Android SDK has been configured with a custom session manager.
 */
export function isNativeSessionManagerAvailable(): boolean {
    const androidWindow = window as AndroidWindow;
    return !!androidWindow.WalletKitNative?.sessionCreate;
}

/**
 * Android native session manager adapter.
 * Uses Android's JavascriptInterface methods to delegate session management
 * to the host application's session manager implementation.
 */
export class AndroidSessionManagerAdapter implements TONConnectSessionManager {
    private androidBridge: AndroidSessionBridge;

    constructor() {
        const androidWindow = window as AndroidWindow;
        if (!androidWindow.WalletKitNative) {
            throw new Error('WalletKitNative bridge not available');
        }
        if (!androidWindow.WalletKitNative.sessionCreate) {
            throw new Error('WalletKitNative session manager methods not available');
        }
        this.androidBridge = androidWindow.WalletKitNative as AndroidSessionBridge;
    }

    /**
     * Initialize the session manager.
     * For Android, sessions are managed natively - no JS-side initialization needed.
     */
    async initialize(): Promise<void> {
        // No-op: Android session manager is already initialized on the native side
    }

    async createSession(
        sessionId: string,
        dAppInfo: DAppInfo,
        wallet: Wallet,
        isJsBridge: boolean,
    ): Promise<TONConnectSession> {
        try {
            const walletId = `${wallet.getNetwork().chainId}:${wallet.getAddress()}`;
            const walletAddress = wallet.getAddress();
            const dAppInfoJson = JSON.stringify(dAppInfo);

            const resultJson = this.androidBridge.sessionCreate(
                sessionId,
                dAppInfoJson,
                walletId,
                walletAddress,
                isJsBridge,
            );

            return JSON.parse(resultJson) as TONConnectSession;
        } catch (err) {
            error('[AndroidSessionManagerAdapter] Failed to create session:', sessionId, err);
            throw err;
        }
    }

    async getSession(sessionId: string): Promise<TONConnectSession | undefined> {
        try {
            const resultJson = this.androidBridge.sessionGet(sessionId);
            if (!resultJson) {
                return undefined;
            }
            return JSON.parse(resultJson) as TONConnectSession;
        } catch (err) {
            error('[AndroidSessionManagerAdapter] Failed to get session:', sessionId, err);
            return undefined;
        }
    }

    async getSessionByDomain(domain: string): Promise<TONConnectSession | undefined> {
        try {
            const resultJson = this.androidBridge.sessionGetByDomain(domain);
            if (!resultJson) {
                return undefined;
            }
            return JSON.parse(resultJson) as TONConnectSession;
        } catch (err) {
            error('[AndroidSessionManagerAdapter] Failed to get session by domain:', domain, err);
            return undefined;
        }
    }

    async getSessions(): Promise<TONConnectSession[]> {
        try {
            const resultJson = this.androidBridge.sessionGetAll();
            return JSON.parse(resultJson) as TONConnectSession[];
        } catch (err) {
            error('[AndroidSessionManagerAdapter] Failed to get sessions:', err);
            return [];
        }
    }

    async getSessionsForWallet(walletId: WalletId): Promise<TONConnectSession[]> {
        try {
            const resultJson = this.androidBridge.sessionGetForWallet(walletId);
            return JSON.parse(resultJson) as TONConnectSession[];
        } catch (err) {
            error('[AndroidSessionManagerAdapter] Failed to get sessions for wallet:', walletId, err);
            return [];
        }
    }

    async removeSession(sessionId: string): Promise<void> {
        try {
            this.androidBridge.sessionRemove(sessionId);
        } catch (err) {
            error('[AndroidSessionManagerAdapter] Failed to remove session:', sessionId, err);
        }
    }

    async removeSessionsForWallet(walletId: WalletId): Promise<void> {
        try {
            this.androidBridge.sessionRemoveForWallet(walletId);
        } catch (err) {
            error('[AndroidSessionManagerAdapter] Failed to remove sessions for wallet:', walletId, err);
        }
    }

    async clearSessions(): Promise<void> {
        try {
            this.androidBridge.sessionClear();
        } catch (err) {
            error('[AndroidSessionManagerAdapter] Failed to clear sessions:', err);
        }
    }
}
