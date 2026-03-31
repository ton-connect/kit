/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import { createServer } from 'node:http';

import {
    createEmptyConfig,
    findAgenticSetupSession,
    listAgenticSetupSessions,
    loadConfigWithMigration,
    removeAgenticSetupSession,
    saveConfig,
    upsertAgenticSetupSession,
} from '../registry/config.js';
import type { AgenticSetupStatus, StoredAgenticSetupSession } from '../registry/config.js';

export interface AgenticDeployCallbackPayload {
    event: 'agent_wallet_deployed';
    network?: {
        chainId?: string | number;
        collectionAddress?: string;
    };
    wallet?: {
        address?: string;
        ownerAddress?: string;
        originOperatorPublicKey?: string;
        operatorPublicKey?: string;
        deployedByUser?: boolean;
        name?: string;
        source?: string;
    };
}

export type { AgenticSetupStatus } from '../registry/config.js';

export interface AgenticSetupSession {
    setupId: string;
    callbackUrl: string;
    status: AgenticSetupStatus;
    createdAt: string;
    expiresAt: string;
    payload?: AgenticDeployCallbackPayload;
}

interface InternalSession extends AgenticSetupSession {
    callbackPath: string;
}

const DEFAULT_HOST = '127.0.0.1';
const DEFAULT_TTL_MS = 1000 * 60 * 60 * 24;

export interface AgenticSetupSessionStore {
    listSessions(): Promise<StoredAgenticSetupSession[]>;
    upsertSession(session: StoredAgenticSetupSession): Promise<void>;
    removeSession(setupId: string): Promise<void>;
}

export class ConfigBackedAgenticSetupSessionStore implements AgenticSetupSessionStore {
    async listSessions(): Promise<StoredAgenticSetupSession[]> {
        return listAgenticSetupSessions((await loadConfigWithMigration()) ?? createEmptyConfig());
    }

    async upsertSession(session: StoredAgenticSetupSession): Promise<void> {
        const config = (await loadConfigWithMigration()) ?? createEmptyConfig();
        saveConfig(upsertAgenticSetupSession(config, session));
    }

    async removeSession(setupId: string): Promise<void> {
        const config = (await loadConfigWithMigration()) ?? createEmptyConfig();
        if (!findAgenticSetupSession(config, setupId)) {
            return;
        }
        saveConfig(removeAgenticSetupSession(config, setupId));
    }
}

export interface AgenticSetupSessionManagerOptions {
    host?: string;
    ttlMs?: number;
    listenPort?: number;
    publicBaseUrl?: string;
    enableInternalHttpServer?: boolean;
    store?: AgenticSetupSessionStore;
}

export class AgenticSetupSessionManager {
    private server: ReturnType<typeof createServer> | null = null;
    private callbackBaseUrl: string | null = null;
    private readonly sessions = new Map<string, InternalSession>();

    private readonly host: string;
    private readonly ttlMs: number;
    private readonly listenPort: number;
    private readonly publicBaseUrl?: string;
    private readonly enableInternalHttpServer: boolean;
    private readonly store?: AgenticSetupSessionStore;

    private constructor(options: AgenticSetupSessionManagerOptions = {}) {
        this.host = options.host ?? DEFAULT_HOST;
        this.ttlMs = options.ttlMs ?? DEFAULT_TTL_MS;
        this.listenPort = options.listenPort ?? 0;
        this.publicBaseUrl = options.publicBaseUrl?.replace(/\/+$/, '');
        this.enableInternalHttpServer = options.enableInternalHttpServer ?? true;
        this.store = options.store;
    }

    static async create(options: AgenticSetupSessionManagerOptions = {}): Promise<AgenticSetupSessionManager> {
        const manager = new AgenticSetupSessionManager(options);
        await manager.syncFromStore();
        return manager;
    }

    private async syncFromStore(): Promise<void> {
        if (!this.store) {
            return;
        }

        this.sessions.clear();
        for (const session of await this.store.listSessions()) {
            this.sessions.set(session.setup_id, this.fromStoredSession(session));
        }
    }

    private toStoredSession(session: InternalSession): StoredAgenticSetupSession {
        return {
            setup_id: session.setupId,
            callback_url: session.callbackUrl,
            status: session.status,
            created_at: session.createdAt,
            expires_at: session.expiresAt,
            ...(session.payload ? { payload: session.payload } : {}),
        };
    }

    private fromStoredSession(session: StoredAgenticSetupSession): InternalSession {
        const callbackPath = `/agentic/callback/${session.setup_id}`;
        return {
            setupId: session.setup_id,
            callbackPath,
            callbackUrl: session.callback_url,
            status: session.status,
            createdAt: session.created_at,
            expiresAt: session.expires_at,
            ...(session.payload ? { payload: session.payload } : {}),
        };
    }

    private persistSession(session: InternalSession): void {
        this.sessions.set(session.setupId, session);
        this.store?.upsertSession(this.toStoredSession(session));
    }

    private deleteSession(setupId: string): void {
        this.sessions.delete(setupId);
        this.store?.removeSession(setupId);
    }

    private cleanupExpiredSessions(): void {
        this.syncFromStore();
        const now = Date.now();
        for (const [_setupId, session] of this.sessions.entries()) {
            if (new Date(session.expiresAt).getTime() <= now && session.status === 'pending') {
                this.persistSession({ ...session, status: 'expired' });
            }
        }
    }

    private buildCallbackUrl(callbackPath: string): string {
        if (this.publicBaseUrl) {
            return `${this.publicBaseUrl}${callbackPath}`;
        }
        if (this.callbackBaseUrl) {
            return `${this.callbackBaseUrl}${callbackPath}`;
        }
        throw new Error('Agentic callback base URL is not configured.');
    }

    private async ensureServer(): Promise<void> {
        if (!this.enableInternalHttpServer) {
            return;
        }

        if (this.server && this.callbackBaseUrl) {
            return;
        }

        this.server = createServer((req, res) => {
            void this.handleCallbackHttpRequest(req, res);
        });

        await new Promise<void>((resolve, reject) => {
            this.server!.once('error', reject);
            this.server!.listen(this.listenPort, this.host, () => resolve());
        });

        const address = this.server.address();
        if (!address || typeof address === 'string') {
            throw new Error('Failed to start agentic setup callback server');
        }
        this.callbackBaseUrl = `http://${this.host}:${address.port}`;
    }

    private async readRequestBody(req: IncomingMessage): Promise<Buffer> {
        const chunks: Buffer[] = [];
        await new Promise<void>((resolve, reject) => {
            req.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            req.on('end', () => resolve());
            req.on('error', reject);
        });
        return Buffer.concat(chunks);
    }

    private writeCorsHeaders(res: ServerResponse): void {
        res.setHeader('access-control-allow-origin', '*');
        res.setHeader('access-control-allow-methods', 'POST, OPTIONS');
        res.setHeader('access-control-allow-headers', 'content-type');
    }

    async handleCallbackHttpRequest(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
        const url = new URL(req.url || '/', `http://${this.host}`);
        const match = /^\/agentic\/callback\/([^/]+)$/.exec(url.pathname);

        if (!match) {
            return false;
        }

        if (req.method === 'OPTIONS') {
            this.writeCorsHeaders(res);
            res.writeHead(204).end();
            return true;
        }

        if (req.method !== 'POST') {
            this.writeCorsHeaders(res);
            res.writeHead(405, { 'content-type': 'application/json' }).end(
                JSON.stringify({ ok: false, error: 'Method Not Allowed' }),
            );
            return true;
        }

        this.syncFromStore();
        const session = this.sessions.get(match[1]!);
        if (!session) {
            this.writeCorsHeaders(res);
            res.writeHead(404, { 'content-type': 'application/json' }).end(
                JSON.stringify({ ok: false, error: 'Unknown setup session' }),
            );
            return true;
        }

        try {
            const payload = JSON.parse(
                (await this.readRequestBody(req)).toString('utf-8'),
            ) as AgenticDeployCallbackPayload;
            if (payload.event !== 'agent_wallet_deployed') {
                throw new Error(`Unexpected callback event: ${String(payload.event)}`);
            }

            this.persistSession({
                ...session,
                payload,
                status: 'callback_received',
            });

            this.writeCorsHeaders(res);
            res.writeHead(200, { 'content-type': 'application/json' }).end(JSON.stringify({ ok: true }));
            return true;
        } catch (error) {
            this.writeCorsHeaders(res);
            res.writeHead(400, { 'content-type': 'application/json' }).end(
                JSON.stringify({
                    ok: false,
                    error: error instanceof Error ? error.message : 'Invalid payload',
                }),
            );
            return true;
        }
    }

    async createSession(setupId: string): Promise<AgenticSetupSession> {
        await this.ensureServer();
        this.cleanupExpiredSessions();
        const createdAt = new Date().toISOString();
        const expiresAt = new Date(Date.now() + this.ttlMs).toISOString();
        const callbackPath = `/agentic/callback/${setupId}`;
        const session: InternalSession = {
            setupId,
            callbackPath,
            callbackUrl: this.buildCallbackUrl(callbackPath),
            createdAt,
            expiresAt,
            status: 'pending',
        };
        this.persistSession(session);
        return { ...session };
    }

    getSession(setupId: string): AgenticSetupSession | null {
        this.syncFromStore();
        this.cleanupExpiredSessions();
        const session = this.sessions.get(setupId);
        return session ? { ...session } : null;
    }

    listSessions(): AgenticSetupSession[] {
        this.syncFromStore();
        this.cleanupExpiredSessions();
        return [...this.sessions.values()].map((session) => ({ ...session }));
    }

    markCompleted(setupId: string): void {
        this.syncFromStore();
        this.deleteSession(setupId);
    }

    cancelSession(setupId: string): void {
        this.syncFromStore();
        this.deleteSession(setupId);
    }

    async close(): Promise<void> {
        this.sessions.clear();
        this.callbackBaseUrl = null;

        if (!this.server) {
            return;
        }

        const server = this.server;
        this.server = null;
        await new Promise<void>((resolve, reject) => {
            server.close((error) => {
                if (error) {
                    reject(error);
                } else {
                    resolve();
                }
            });
        });
    }
}
