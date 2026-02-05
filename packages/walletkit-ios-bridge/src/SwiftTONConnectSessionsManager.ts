/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TONConnectSessionManager, TONConnectSession, DAppInfo, Wallet, WalletId } from '@ton/walletkit';

/**
 * Swift adapter for TONConnect session management.
 * Delegates all session operations to the Swift implementation.
 */
export class SwiftTONConnectSessionsManager implements TONConnectSessionManager {
    private swiftSessionsManager: TONConnectSessionManager;

    constructor(swiftSessionsManager: TONConnectSessionManager) {
        this.swiftSessionsManager = swiftSessionsManager;
    }

    async initialize(): Promise<void> {
        /*
        No initialization needed for Swift implementation.
        This method needed to comply with the TONConnectSessionManager interface.
        Such compliance is needed for backward compability with existing codebase.
        */
    }

    async createSession(
        sessionId: string,
        dAppInfo: DAppInfo,
        wallet: Wallet,
        isJsBridge: boolean,
    ): Promise<TONConnectSession> {
        return await this.swiftSessionsManager.createSession(sessionId, dAppInfo, wallet, isJsBridge);
    }

    async getSession(sessionId: string): Promise<TONConnectSession | undefined> {
        return await this.swiftSessionsManager.getSession(sessionId);
    }

    async getSessions(parameters?: {
        walletId?: WalletId;
        domain?: string;
        isJsBridge?: boolean;
    }): Promise<TONConnectSession[]> {
        return await this.swiftSessionsManager.getSessions(parameters);
    }

    async removeSession(sessionId: string): Promise<TONConnectSession | undefined> {
        return await this.swiftSessionsManager.removeSession(sessionId);
    }

    async removeSessions(parameters?: {
        walletId?: WalletId;
        domain?: string;
        isJsBridge?: boolean;
    }): Promise<TONConnectSession[]> {
        return await this.swiftSessionsManager.removeSessions(parameters);
    }

    async clearSessions(): Promise<void> {
        await this.swiftSessionsManager.clearSessions();
    }
}
