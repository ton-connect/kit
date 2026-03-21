/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Network } from '../../api/models';
import { globalLogger } from '../../core/Logger';
import type { StreamingProviderListener } from '../StreamingProvider';
import type { StreamingV2SubscriptionRequest, StreamingV2EventType } from './types/core';
import { isAccountStateNotification } from './guards/account';
import { isJettonsNotification } from './guards/jetton';
import { isTransactionsNotification, isTraceNotification, isTraceInvalidatedNotification } from './guards/transaction';
import { asAddressFriendly } from '../../utils';
import { mapBalance } from './mappers/map-balance';
import { mapTransactions } from './mappers/map-transactions';
import { mapJettons } from './mappers/map-jettons';
import { mapTrace } from './mappers/map-trace';
import { WebsocketStreamingProvider } from '../WebsocketStreamingProvider';

const log = globalLogger.createChild('TonCenterStreamingProvider');

const WS_PATH = '/api/streaming/v2/ws';

export interface TonCenterStreamingProviderConfig {
    endpoint?: string;
    apiKey?: string;
    network?: Network;
    listener: StreamingProviderListener;
    getWatchers: () => Map<string, Set<string>>;
}

/**
 * Toncenter-specific implementation of StreamingProvider.
 * Manages a single WebSocket connection and reports account updates.
 */
export class TonCenterStreamingProvider extends WebsocketStreamingProvider {
    private baseUrl: string;
    private apiKey?: string;
    private network?: Network;

    private requestId = 0;
    private lastAddresses: Set<string> = new Set();
    private syncTimer: ReturnType<typeof setTimeout> | null = null;

    constructor(config: TonCenterStreamingProviderConfig) {
        super(config.listener, config.getWatchers);

        this.network = config.network;
        this.apiKey = config.apiKey;

        const base =
            config.endpoint ??
            (this.network?.chainId === Network.mainnet().chainId
                ? 'wss://toncenter.com'
                : 'wss://testnet.toncenter.com');

        this.baseUrl = base.replace(/\/$/, '').replace(/^https?/, 'wss') + WS_PATH;
    }

    protected getUrl(): string {
        let url = this.baseUrl;
        if (this.apiKey) {
            const separator = url.includes('?') ? '&' : '?';
            url += `${separator}api_key=${encodeURIComponent(this.apiKey)}`;
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
        log.info('fullResync triggered', { isConnected: this.isConnected, readyState: this.ws?.readyState });
        if (!this.isConnected || this.ws?.readyState !== WebSocket.OPEN) {
            return;
        }

        const watched = this.getWatchers();
        const addresses = new Set<string>();
        const types = new Set<StreamingV2EventType>();

        watched.forEach((ids, type) => {
            const toncenterType = this.mapToToncenterType(type as string);
            if (!toncenterType) return;
            types.add(toncenterType);
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
            log.debug('Toncenter WS received message:', m);
            if (m.status === 'subscribed' || m.status === 'pong') {
                return;
            }

            if (isAccountStateNotification(msg)) {
                const update = mapBalance(msg);
                this.listener.onBalanceUpdate(update);
            }

            if (isTransactionsNotification(msg)) {
                const watchedTransactions = this.getWatchers().get('transactions') ?? new Set<string>();
                const accounts = new Set<string>();
                msg.transactions.forEach((tx: { account: string }) => accounts.add(tx.account));

                accounts.forEach((account) => {
                    const friendly = asAddressFriendly(account);
                    if (watchedTransactions.has(friendly)) {
                        const update = mapTransactions(account, msg);
                        this.listener.onTransactions(update);
                    }
                });
            }

            if (isJettonsNotification(msg)) {
                const watchedJettons = this.getWatchers().get('jettons') ?? new Set<string>();
                const update = mapJettons(msg);
                if (watchedJettons.has(update.ownerAddress)) {
                    this.listener.onJettonsUpdate(update);
                }
            }

            if (isTraceNotification(msg) || isTraceInvalidatedNotification(msg)) {
                if (isTraceInvalidatedNotification(msg)) {
                    log.debug('Trace invalidated', { hash: msg.trace_external_hash_norm });
                }
                const update = mapTrace(msg);

                // We only emit trace update if it belongs to a watched hash or address
                // (WebsocketStreamingProvider handles address-based trace subscriptions too)
                this.listener.onTraceUpdate(update);
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

    private mapToToncenterType(type: string): StreamingV2EventType | null {
        switch (type) {
            case 'balance':
                return 'account_state_change';
            case 'transactions':
                return 'transactions';
            case 'jettons':
                return 'jettons_change';
            case 'traces':
                return 'trace';
            default:
                return null;
        }
    }
}
