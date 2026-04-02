/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { globalLogger } from '../core/Logger';
import type { StreamingProvider } from '../api/interfaces/StreamingProvider';
import type { BalanceUpdate, TransactionsUpdate, JettonUpdate } from '../api/models';
import type { StreamingWatchType } from '../api/models/streaming/StreamingWatchType';
import { asAddressFriendly } from '../utils/address';

const log = globalLogger.createChild('WebsocketStreamingProvider');

export abstract class WebsocketStreamingProvider implements StreamingProvider {
    readonly type = 'streaming' as const;
    abstract readonly providerId: string;

    protected ws: WebSocket | null = null;
    protected isConnected = false;

    private balanceCallbacks: Map<string, Set<(update: BalanceUpdate) => void>> = new Map();
    private transactionCallbacks: Map<string, Set<(update: TransactionsUpdate) => void>> = new Map();
    private jettonCallbacks: Map<string, Set<(update: JettonUpdate) => void>> = new Map();

    private reconnectAttempts = 0;
    private maxReconnectAttempts = 50;
    private reconnectDelay = 300;
    private pingInterval: ReturnType<typeof setInterval> | null = null;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    // Abstract methods to be implemented by children
    protected abstract getUrl(): string;
    protected abstract onMessage(event: MessageEvent): void;
    protected abstract fullResync(): void;
    protected abstract onWatch(type: StreamingWatchType, id: string): void;
    protected abstract onUnwatch(type: StreamingWatchType, id: string): void;

    protected getActiveWatchers(): Map<StreamingWatchType, Set<string>> {
        const result = new Map<StreamingWatchType, Set<string>>();
        if (this.balanceCallbacks.size > 0) result.set('balance', new Set(this.balanceCallbacks.keys()));
        if (this.transactionCallbacks.size > 0) result.set('transactions', new Set(this.transactionCallbacks.keys()));
        if (this.jettonCallbacks.size > 0) result.set('jettons', new Set(this.jettonCallbacks.keys()));
        return result;
    }

    protected hasActiveSubscriptions(): boolean {
        return this.balanceCallbacks.size > 0 || this.transactionCallbacks.size > 0 || this.jettonCallbacks.size > 0;
    }

    protected emitBalance(address: string, update: BalanceUpdate): void {
        this.balanceCallbacks.get(address)?.forEach((cb) => cb(update));
    }

    protected emitTransactions(address: string, update: TransactionsUpdate): void {
        this.transactionCallbacks.get(address)?.forEach((cb) => cb(update));
    }

    protected emitJettons(ownerAddress: string, update: JettonUpdate): void {
        this.jettonCallbacks.get(ownerAddress)?.forEach((cb) => cb(update));
    }

    private addCallback<T>(
        map: Map<string, Set<T>>,
        address: string,
        callback: T,
        watchType: StreamingWatchType,
    ): () => void {
        let set = map.get(address);
        const isFirst = !set || set.size === 0;
        if (!set) {
            set = new Set();
            map.set(address, set);
        }
        set.add(callback);
        if (isFirst) {
            this.onWatch(watchType, address);
            this.ensureConnected();
        }
        return () => {
            set!.delete(callback);
            if (set!.size === 0) {
                map.delete(address);
                this.onUnwatch(watchType, address);
                this.checkClose();
            }
        };
    }

    watchBalance(address: string, onChange: (update: BalanceUpdate) => void): () => void {
        return this.addCallback(this.balanceCallbacks, asAddressFriendly(address), onChange, 'balance');
    }

    watchTransactions(address: string, onChange: (update: TransactionsUpdate) => void): () => void {
        return this.addCallback(this.transactionCallbacks, asAddressFriendly(address), onChange, 'transactions');
    }

    watchJettons(address: string, onChange: (update: JettonUpdate) => void): () => void {
        return this.addCallback(this.jettonCallbacks, asAddressFriendly(address), onChange, 'jettons');
    }

    close(): void {
        this.stopReconnect();
        this.stopPing();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        log.info('WebsocketStreamingProvider disconnected');
    }

    protected checkClose(): void {
        if (!this.hasActiveSubscriptions()) {
            this.close();
        }
    }

    connect(): void {
        this.ensureConnected();
    }

    protected ensureConnected(): void {
        if (this.isConnected || this.ws?.readyState === WebSocket.CONNECTING) {
            return;
        }
        this.openConnection();
    }

    private openConnection(): void {
        this.stopReconnect();
        const url = this.getUrl();
        log.info('Connecting to WebSocket', { url: url.replace(/api_key=[^&]+/, 'api_key=***') });

        try {
            this.ws = new WebSocket(url);
        } catch (error) {
            log.error('WebSocket creation failed', { error });
            this.scheduleReconnect();
            return;
        }

        this.ws.onopen = () => {
            log.info('WebSocket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;
            this.fullResync();
            this.startPing();
        };

        this.ws.onmessage = this.onMessage.bind(this);

        this.ws.onerror = (error) => {
            log.error('WebSocket error', { error });
        };

        this.ws.onclose = () => {
            log.info('WebSocket closed');
            this.isConnected = false;
            this.stopPing();
            this.ws = null;

            if (this.hasActiveSubscriptions()) {
                this.scheduleReconnect();
            }
        };
    }

    protected send(payload: unknown): void {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify(payload));
        }
    }

    protected startPing(): void {
        this.stopPing();
        this.pingInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                const message = this.getPingMessage();
                if (message) {
                    this.send(message);
                }
            }
        }, 15000); // 15s interval
    }

    protected stopPing(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    protected scheduleReconnect(): void {
        if (this.reconnectTimeout) return;

        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            log.error('Max reconnect attempts reached, stopping reconnects');
            this.close();
            return;
        }

        this.reconnectAttempts++;
        const delayMs = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), 5000);
        log.info(`Scheduling reconnect in ${delayMs}ms (attempt ${this.reconnectAttempts})`);
        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            this.openConnection();
        }, delayMs);
    }

    protected stopReconnect(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }

    /**
     * Override to determine the ping payload sent every 15s.
     * If returns null, no ping is sent.
     */
    protected getPingMessage(): unknown | null {
        return null;
    }
}
