/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { LRUCache } from 'lru-cache';

import { globalLogger } from '../core/Logger';
import type { ProviderFactoryContext } from '../types/factory';
import type { StreamingV2SubscriptionRequest, StreamingV2EventType } from './toncenter/types';
import { isAccountStateNotification } from './toncenter/guards/account';
import { isJettonsNotification } from './toncenter/guards/jetton';
import { isTransactionsNotification, isTraceInvalidatedNotification } from './toncenter/guards/transaction';
import { Base64ToHex } from '../utils/base64';
import { asAddressFriendly } from '../utils/address';
import { mapBalance } from './toncenter/mappers/map-balance';
import { mapTransactions } from './toncenter/mappers/map-transactions';
import { mapJettons } from './toncenter/mappers/map-jettons';
import { WebsocketStreamingProvider } from './WebsocketStreamingProvider';

const log = globalLogger.createChild('TonStreamingV2');

/** Path for Toncenter-compatible streaming v2 WebSocket API. */
export const STREAMING_V2_WS_PATH = '/api/streaming/v2/ws';

export type TonStreamingV2AuthParam = 'api_key' | 'token';

export type TonStreamingV2BaseOptions = {
    providerId: string;
    baseUrl: string;
    authQueryParam: TonStreamingV2AuthParam;
    authSecret?: string;
};

/**
 * Shared WebSocket streaming implementation for the v2 protocol (Toncenter / TonAPI).
 */
export abstract class TonStreamingV2BaseProvider extends WebsocketStreamingProvider {
    readonly providerId: string;

    private readonly baseUrl: string;
    private readonly authSecret?: string;
    private readonly authQueryParam: TonStreamingV2AuthParam;

    private requestId = 0;
    private lastAddresses: Set<string> = new Set();
    private syncTimer: ReturnType<typeof setTimeout> | null = null;
    private traceCache = new LRUCache<string, { score: number; accounts: Set<string> }>({ max: 10000 });

    constructor(_ctx: ProviderFactoryContext, options: TonStreamingV2BaseOptions) {
        super();
        this.providerId = options.providerId;
        this.baseUrl = options.baseUrl;
        this.authSecret = options.authSecret;
        this.authQueryParam = options.authQueryParam;
    }

    disconnect(): void {
        if (this.syncTimer) {
            clearTimeout(this.syncTimer);
            this.syncTimer = null;
        }
        this.traceCache.clear();
        this.lastAddresses.clear();
        super.disconnect();
    }

    protected getUrl(): string {
        let url = this.baseUrl;
        if (this.authSecret) {
            const separator = url.includes('?') ? '&' : '?';
            url += `${separator}${this.authQueryParam}=${encodeURIComponent(this.authSecret)}`;
        }
        return url;
    }

    protected getPingMessage(): unknown | null {
        return { operation: 'ping', id: `ping-${Date.now()}` };
    }

    protected onWatch(type: string, id: string): void {
        log.info('onWatch triggered', { type, id, isConnected: this.isConnected, readyState: this.ws?.readyState });
        this.requestSync();
    }

    protected onUnwatch(type: string, id: string): void {
        log.info('onUnwatch triggered', { type, id, isConnected: this.isConnected, readyState: this.ws?.readyState });
        this.requestSync();
    }

    protected fullResync(): void {
        if (this.syncTimer) {
            clearTimeout(this.syncTimer);
            this.syncTimer = null;
        }
        log.info('fullResync triggered', { isConnected: this.isConnected, readyState: this.ws?.readyState });
        if (!this.isConnected || this.ws?.readyState !== WebSocket.OPEN) {
            return;
        }

        const watched = this.getActiveWatchers();
        const addresses = new Set<string>();
        const types = new Set<StreamingV2EventType>();

        watched.forEach((ids, type) => {
            const streamType = this.mapWatchTypeToStreamEvent(type as string);
            if (!streamType) return;
            types.add(streamType);
            ids.forEach((id) => addresses.add(id));
        });

        if (addresses.size === 0) {
            if (this.lastAddresses.size > 0) {
                const msgId = `clear-${Date.now()}-${++this.requestId}`;
                this.send({
                    operation: 'unsubscribe',
                    id: msgId,
                    addresses: Array.from(this.lastAddresses),
                });
                this.lastAddresses.clear();
                log.info('Cleared all subscriptions', { msgId });
            }
            return;
        }

        const request: StreamingV2SubscriptionRequest = {
            types: Array.from(types),
            addresses: Array.from(addresses),
            min_finality: 'pending',
            include_metadata: true,
        };

        const msgId = `sync-${Date.now()}-${++this.requestId}`;
        this.send({
            operation: 'subscribe',
            id: msgId,
            ...request,
        });

        this.lastAddresses = addresses;

        log.info('Sent monolithic subscription', {
            msgId,
            types: Array.from(types),
            addressCount: addresses.size,
        });
    }

    protected onMessage(event: MessageEvent): void {
        try {
            const msg = JSON.parse(event.data as string) as unknown;
            const m = msg as Record<string, unknown>;
            log.debug('Streaming v2 WS received message:', m);
            if (m.status === 'subscribed' || m.status === 'pong') {
                return;
            }

            if (isAccountStateNotification(msg)) {
                const update = mapBalance(msg);
                if (this.isWatching('balance', update.address)) {
                    this.emitBalance(update.address, update);
                }
                return;
            }

            if (isTraceInvalidatedNotification(msg)) {
                log.debug('Trace invalidated', { hash: msg.trace_external_hash_norm });
                const entry = this.traceCache.get(msg.trace_external_hash_norm);
                if (entry) {
                    entry.accounts.forEach((account) => {
                        const friendly = asAddressFriendly(account);
                        if (this.isWatching('transactions', friendly)) {
                            this.emitTransactions(friendly, {
                                type: 'transactions',
                                address: friendly,
                                transactions: [],
                                traceHash: Base64ToHex(msg.trace_external_hash_norm),
                                status: 'invalidated',
                            });
                        }
                    });
                    this.traceCache.delete(msg.trace_external_hash_norm);
                }
                return;
            }

            if (isTransactionsNotification(msg)) {
                const finalityScore = this.getFinalityScore(msg.finality);
                const entry = this.traceCache.get(msg.trace_external_hash_norm);

                if (entry && finalityScore < entry.score) {
                    log.debug('Ignoring transactions notification due to lower finality', {
                        hash: msg.trace_external_hash_norm,
                        msgFinality: msg.finality,
                        cachedScore: entry.score,
                    });
                    return;
                }

                const traceEntry = entry ?? { score: finalityScore, accounts: new Set<string>() };
                traceEntry.score = finalityScore;
                if (!entry) {
                    this.traceCache.set(msg.trace_external_hash_norm, traceEntry);
                }

                const uniqueAccounts = new Set<string>();

                msg.transactions.forEach((tx: { account: string }) => {
                    if (uniqueAccounts.has(tx.account)) return;
                    uniqueAccounts.add(tx.account);
                    traceEntry.accounts.add(tx.account);

                    const friendly = asAddressFriendly(tx.account);
                    if (this.isWatching('transactions', friendly)) {
                        this.emitTransactions(friendly, mapTransactions(tx.account, msg));
                    }
                });
                return;
            }

            if (isJettonsNotification(msg)) {
                const update = mapJettons(msg);
                if (this.isWatching('jettons', update.ownerAddress)) {
                    this.emitJettons(update.ownerAddress, update);
                }
                return;
            }
        } catch (err) {
            log.warn('Failed to parse WebSocket message', { error: err });
        }
    }

    private requestSync(): void {
        if (this.syncTimer) {
            clearTimeout(this.syncTimer);
        }
        this.syncTimer = setTimeout(() => {
            this.syncTimer = null;
            this.fullResync();
        }, 50);
    }

    private mapWatchTypeToStreamEvent(type: string): StreamingV2EventType | null {
        switch (type) {
            case 'balance':
                return 'account_state_change';
            case 'transactions':
                return 'transactions';
            case 'jettons':
                return 'jettons_change';
            default:
                return null;
        }
    }

    private getFinalityScore(finality: string): number {
        switch (finality) {
            case 'pending':
                return 0;
            case 'confirmed':
                return 1;
            case 'finalized':
                return 2;
            default:
                return -1;
        }
    }
}
