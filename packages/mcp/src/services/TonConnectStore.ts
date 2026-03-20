/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Storage } from '@ton/walletkit';
import type { StorageAdapter } from '@ton/walletkit';

import type {
    TonConnectRequestListFilters,
    TonConnectRequestRecord,
    TonConnectRequestStatus,
} from '../types/tonconnect.js';

interface TonConnectStoreState {
    version: 1;
    requests: TonConnectRequestRecord[];
}

const STORE_KEY = 'mcp_requests';
const DEFAULT_STATE: TonConnectStoreState = {
    version: 1,
    requests: [],
};

export class TonConnectStore {
    private readonly storage: Storage;

    constructor(adapter: StorageAdapter) {
        this.storage = new Storage(adapter);
    }

    async listRequests(filters: TonConnectRequestListFilters = {}): Promise<TonConnectRequestRecord[]> {
        const state = await this.readState();
        let requests = [...state.requests];

        if (filters.status) {
            requests = requests.filter((request) => request.status === filters.status);
        }

        if (filters.type) {
            requests = requests.filter((request) => request.type === filters.type);
        }

        requests.sort((left, right) => {
            const leftTime = Date.parse(left.updatedAt) || 0;
            const rightTime = Date.parse(right.updatedAt) || 0;
            return rightTime - leftTime;
        });

        if (filters.limit && filters.limit > 0) {
            requests = requests.slice(0, filters.limit);
        }

        return requests;
    }

    async getRequest(requestId: string): Promise<TonConnectRequestRecord | null> {
        const state = await this.readState();
        return state.requests.find((request) => request.requestId === requestId) ?? null;
    }

    async upsertRequest(record: TonConnectRequestRecord): Promise<TonConnectRequestRecord> {
        return this.writeState((state) => {
            const next = [...state.requests];
            const index = next.findIndex((request) => request.requestId === record.requestId);
            if (index >= 0) {
                next[index] = record;
            } else {
                next.push(record);
            }

            return {
                ...state,
                requests: this.pruneRequests(next),
            };
        }).then((state) => state.requests.find((request) => request.requestId === record.requestId)!);
    }

    async updateRequestStatus(
        requestId: string,
        status: TonConnectRequestStatus,
        reason?: string,
    ): Promise<TonConnectRequestRecord | null> {
        return this.writeState((state) => {
            const now = new Date().toISOString();
            const requests = state.requests.map((request) => {
                if (request.requestId !== requestId) {
                    return request;
                }

                return {
                    ...request,
                    status,
                    updatedAt: now,
                    ...(status === 'approved' || status === 'rejected' || status === 'expired' || status === 'failed'
                        ? { completedAt: now }
                        : {}),
                    ...(reason ? { reason } : {}),
                };
            });

            return {
                ...state,
                requests: this.pruneRequests(requests),
            };
        }).then((state) => state.requests.find((request) => request.requestId === requestId) ?? null);
    }

    async expirePendingBySession(sessionId?: string, reason: string = 'Session disconnected'): Promise<void> {
        if (!sessionId) {
            return;
        }

        await this.writeState((state) => {
            const now = new Date().toISOString();
            return {
                ...state,
                requests: this.pruneRequests(
                    state.requests.map((request) => {
                        if (request.status !== 'pending' || request.summary.sessionId !== sessionId) {
                            return request;
                        }

                        return {
                            ...request,
                            status: 'expired',
                            updatedAt: now,
                            completedAt: now,
                            reason,
                        };
                    }),
                ),
            };
        });
    }

    async countRequests(status?: TonConnectRequestStatus): Promise<number> {
        const state = await this.readState();
        if (!status) {
            return state.requests.length;
        }
        return state.requests.filter((request) => request.status === status).length;
    }

    private async readState(): Promise<TonConnectStoreState> {
        const state = await this.storage.get<TonConnectStoreState>(STORE_KEY);
        if (!state || typeof state !== 'object' || !Array.isArray(state.requests)) {
            return { ...DEFAULT_STATE };
        }

        return {
            version: 1,
            requests: state.requests.filter((request): request is TonConnectRequestRecord => {
                return Boolean(
                    request &&
                        typeof request === 'object' &&
                        typeof request.requestId === 'string' &&
                        typeof request.type === 'string' &&
                        typeof request.status === 'string' &&
                        typeof request.createdAt === 'string' &&
                        typeof request.updatedAt === 'string' &&
                        request.summary &&
                        typeof request.summary === 'object',
                );
            }),
        };
    }

    private async writeState(update: (state: TonConnectStoreState) => TonConnectStoreState): Promise<TonConnectStoreState> {
        const state = update(await this.readState());
        await this.storage.set(STORE_KEY, state);
        return state;
    }

    private pruneRequests(requests: TonConnectRequestRecord[]): TonConnectRequestRecord[] {
        const pending = requests.filter((request) => request.status === 'pending');
        const completed = requests
            .filter((request) => request.status !== 'pending')
            .sort((left, right) => (Date.parse(right.updatedAt) || 0) - (Date.parse(left.updatedAt) || 0))
            .slice(0, 100);

        return [...pending, ...completed];
    }
}
