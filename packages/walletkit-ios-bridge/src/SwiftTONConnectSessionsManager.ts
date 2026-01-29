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

    async getSessionByDomain(domain: string): Promise<TONConnectSession | undefined> {
        return await this.swiftSessionsManager.getSessionByDomain(domain);
    }

    async getSessions(): Promise<TONConnectSession[]> {
        return await this.swiftSessionsManager.getSessions();
    }

    async getSessionsForWallet(walletId: WalletId): Promise<TONConnectSession[]> {
        return await this.swiftSessionsManager.getSessionsForWallet(walletId);
    }

    async removeSession(sessionId: string): Promise<void> {
        await this.swiftSessionsManager.removeSession(sessionId);
    }

    async removeSessionsForWallet(walletId: WalletId): Promise<void> {
        await this.swiftSessionsManager.removeSessionsForWallet(walletId);
    }

    async clearSessions(): Promise<void> {
        await this.swiftSessionsManager.clearSessions();
    }
}
