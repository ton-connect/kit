/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    ConnectionRequestEvent,
    SendTransactionApprovalResponse,
    SendTransactionRequestEvent,
    SignDataApprovalResponse,
    SignDataRequestEvent,
    TonWalletKit,
    WalletAdapter,
    Wallet,
} from '@ton/walletkit';

import { sanitizeTonConnectSession, mapRequestSummary } from './TonConnectMappers.js';
import { TonConnectStore } from './TonConnectStore.js';
import type {
    TonConnectRequestListFilters,
    TonConnectRequestRecord,
    TonConnectRequestStatus,
    TonConnectRuntimeStatus,
    TonConnectSessionSummary,
    TonConnectResolvedConfig,
} from '../types/tonconnect.js';

type PendingRuntimeEvent =
    | { type: 'connect'; event: ConnectionRequestEvent }
    | { type: 'sendTransaction'; event: SendTransactionRequestEvent }
    | { type: 'signData'; event: SignDataRequestEvent };

export interface TonConnectRuntimeContext {
    kit: TonWalletKit;
    adapter: WalletAdapter;
    close: () => Promise<void>;
}

export interface TonConnectRuntimeServiceOptions {
    runtimeKey: string;
    config: TonConnectResolvedConfig;
    store: TonConnectStore;
    createContext: () => Promise<TonConnectRuntimeContext>;
}

export class TonConnectRuntimeService {
    private readonly runtimeKey: string;
    private readonly config: TonConnectResolvedConfig;
    private readonly store: TonConnectStore;
    private readonly createContext: () => Promise<TonConnectRuntimeContext>;

    private startPromise?: Promise<void>;
    private context?: TonConnectRuntimeContext;
    private wallet?: Wallet;
    private startedAt?: string;
    private lastError?: string;
    private readonly pendingEvents = new Map<string, PendingRuntimeEvent>();

    constructor(options: TonConnectRuntimeServiceOptions) {
        this.runtimeKey = options.runtimeKey;
        this.config = options.config;
        this.store = options.store;
        this.createContext = options.createContext;
    }

    async start(): Promise<void> {
        if (this.startPromise) {
            await this.startPromise;
            return;
        }

        this.startPromise = this.initialize();
        try {
            await this.startPromise;
        } catch (error) {
            this.startPromise = undefined;
            throw error;
        }
    }

    async close(): Promise<void> {
        this.pendingEvents.clear();
        const currentContext = this.context;
        this.context = undefined;
        this.wallet = undefined;
        this.startPromise = undefined;
        this.startedAt = undefined;
        if (!currentContext) {
            return;
        }

        try {
            currentContext.kit.removeConnectRequestCallback();
            currentContext.kit.removeTransactionRequestCallback();
            currentContext.kit.removeSignDataRequestCallback();
            currentContext.kit.removeDisconnectCallback();
            currentContext.kit.removeErrorCallback();
        } catch {
            // Best-effort cleanup only.
        }

        await currentContext.close();
    }

    async handleUrl(url: string): Promise<{ pendingRequests: number }> {
        await this.start();
        await this.context!.kit.handleTonConnectUrl(url);
        return {
            pendingRequests: await this.store.countRequests('pending'),
        };
    }

    async listRequests(filters: TonConnectRequestListFilters = {}): Promise<TonConnectRequestRecord[]> {
        await this.start();
        return this.store.listRequests(filters);
    }

    async approveRequest(requestId: string): Promise<{
        request: TonConnectRequestRecord;
        result?: SendTransactionApprovalResponse | SignDataApprovalResponse;
    }> {
        await this.start();
        const pending = this.pendingEvents.get(requestId);
        if (!pending) {
            throw new Error(`Pending TonConnect request "${requestId}" is not available in memory.`);
        }

        let result: SendTransactionApprovalResponse | SignDataApprovalResponse | undefined;
        switch (pending.type) {
            case 'connect':
                await this.context!.kit.approveConnectRequest(pending.event);
                break;
            case 'sendTransaction':
                result = await this.context!.kit.approveTransactionRequest(pending.event);
                break;
            case 'signData':
                result = await this.context!.kit.approveSignDataRequest(pending.event);
                break;
        }

        this.pendingEvents.delete(requestId);
        const request = await this.requireUpdatedStatus(requestId, 'approved');
        return { request, ...(result ? { result } : {}) };
    }

    async rejectRequest(requestId: string, reason?: string): Promise<TonConnectRequestRecord> {
        await this.start();
        const pending = this.pendingEvents.get(requestId);
        if (!pending) {
            throw new Error(`Pending TonConnect request "${requestId}" is not available in memory.`);
        }

        switch (pending.type) {
            case 'connect':
                await this.context!.kit.rejectConnectRequest(pending.event, reason);
                break;
            case 'sendTransaction':
                await this.context!.kit.rejectTransactionRequest(pending.event, reason);
                break;
            case 'signData':
                await this.context!.kit.rejectSignDataRequest(pending.event, reason);
                break;
        }

        this.pendingEvents.delete(requestId);
        return this.requireUpdatedStatus(requestId, 'rejected', reason);
    }

    async listSessions(): Promise<TonConnectSessionSummary[]> {
        await this.start();
        const sessions = await this.context!.kit.listSessions();
        return sessions.map((session) => sanitizeTonConnectSession(session));
    }

    async disconnect(sessionId?: string): Promise<{ disconnected: boolean; disconnectedSessions: number }> {
        await this.start();
        const sessionsBefore = await this.context!.kit.listSessions();
        await this.context!.kit.disconnect(sessionId);

        if (sessionId) {
            await this.store.expirePendingBySession(sessionId);
            this.dropPendingEventsBySession(sessionId);
        } else {
            for (const session of sessionsBefore) {
                await this.store.expirePendingBySession(session.sessionId);
                this.dropPendingEventsBySession(session.sessionId);
            }
        }

        return {
            disconnected: true,
            disconnectedSessions: sessionId ? 1 : sessionsBefore.length,
        };
    }

    async getStatus(): Promise<TonConnectRuntimeStatus> {
        const sessions = this.context ? await this.context.kit.listSessions() : [];
        return {
            started: Boolean(this.context),
            ...(this.wallet ? { walletId: this.wallet.getWalletId(), walletAddress: this.wallet.getAddress() } : {}),
            ...(this.startedAt ? { startedAt: this.startedAt } : {}),
            storagePath: this.config.storagePath,
            bridgeUrl: this.config.bridgeUrl,
            pendingRequests: await this.store.countRequests('pending'),
            recentRequests: await this.store.countRequests(),
            activeSessions: sessions.length,
            ...(this.lastError ? { lastError: this.lastError } : {}),
        };
    }

    private async initialize(): Promise<void> {
        try {
            const context = await this.createContext();
            this.context = context;

            context.kit.onConnectRequest(this.handleConnectRequest);
            context.kit.onTransactionRequest(this.handleTransactionRequest);
            context.kit.onSignDataRequest(this.handleSignDataRequest);
            context.kit.onDisconnect(this.handleDisconnect);
            context.kit.onRequestError(this.handleRequestError);

            this.wallet = (await context.kit.addWallet(context.adapter)) ?? context.kit.getWallet(context.adapter.getWalletId());
            if (!this.wallet) {
                throw new Error(`Failed to initialize TonConnect runtime wallet for "${this.runtimeKey}".`);
            }

            this.startedAt = new Date().toISOString();
            this.lastError = undefined;
        } catch (error) {
            this.lastError = error instanceof Error ? error.message : 'Unknown error';
            throw error;
        }
    }

    private readonly handleConnectRequest = async (event: ConnectionRequestEvent): Promise<void> => {
        await this.capturePendingEvent({
            requestId: event.id,
            type: 'connect',
            event,
        });
    };

    private readonly handleTransactionRequest = async (event: SendTransactionRequestEvent): Promise<void> => {
        await this.capturePendingEvent({
            requestId: event.id,
            type: 'sendTransaction',
            event,
        });
    };

    private readonly handleSignDataRequest = async (event: SignDataRequestEvent): Promise<void> => {
        await this.capturePendingEvent({
            requestId: event.id,
            type: 'signData',
            event,
        });
    };

    private readonly handleDisconnect = async (event: { sessionId?: string; from?: string }): Promise<void> => {
        const sessionId = event.sessionId ?? event.from;
        this.dropPendingEventsBySession(sessionId);
        await this.store.expirePendingBySession(sessionId);
    };

    private readonly handleRequestError = async (event: { id: string; error?: { message?: string } }): Promise<void> => {
        this.pendingEvents.delete(event.id);
        await this.store.updateRequestStatus(event.id, 'failed', event.error?.message || 'TonConnect request failed');
    };

    private async capturePendingEvent(
        pending: PendingRuntimeEvent & { requestId: string },
    ): Promise<void> {
        this.pendingEvents.set(pending.requestId, pending);
        const now = new Date().toISOString();
        const existing = await this.store.getRequest(pending.requestId);
        const summary = mapRequestSummary(pending.event);
        await this.store.upsertRequest({
            requestId: pending.requestId,
            type: pending.type,
            status: 'pending',
            createdAt: existing?.createdAt || now,
            updatedAt: now,
            summary,
        });
    }

    private async requireUpdatedStatus(
        requestId: string,
        status: TonConnectRequestStatus,
        reason?: string,
    ): Promise<TonConnectRequestRecord> {
        const record = await this.store.updateRequestStatus(requestId, status, reason);
        if (!record) {
            throw new Error(`TonConnect request "${requestId}" was not found in persistent store.`);
        }
        return record;
    }

    private dropPendingEventsBySession(sessionId?: string): void {
        if (!sessionId) {
            return;
        }

        for (const [requestId, pending] of this.pendingEvents.entries()) {
            const pendingSessionId = pending.event.sessionId ?? pending.event.from;
            if (pendingSessionId === sessionId) {
                this.pendingEvents.delete(requestId);
            }
        }
    }
}
