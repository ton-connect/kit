/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { globalLogger } from '../core/Logger';
import type { StreamingProvider } from '../api/interfaces/StreamingProvider';
import type { BalanceUpdate, TransactionsUpdate, JettonUpdate, Network } from '../api/models';
import type { StreamingWatchType } from '../api/models/streaming/StreamingWatchType';
import { asAddressFriendly } from '../utils/address';

const log = globalLogger.createChild('WebsocketStreamingProvider');

export abstract class WebsocketStreamingProvider implements StreamingProvider {
    readonly type = 'streaming' as const;
    abstract readonly providerId: string;
    abstract readonly network: Network;

    protected ws: WebSocket | null = null;
    protected isConnected = false;

    private balanceCallbacks: Map<string, Set<(update: BalanceUpdate) => void>> = new Map();
    private transactionCallbacks: Map<string, Set<(update: TransactionsUpdate) => void>> = new Map();
    private jettonCallbacks: Map<string, Set<(update: JettonUpdate) => void>> = new Map();

    private connectionChangeCallbacks: Set<(connected: boolean) => void> = new Set();

    private reconnectAttempts = 0;
    private static readonly RECONNECT_DELAYS = [500, 1000, 2000, 4000, 8000];
    private pingTimeout: ReturnType<typeof setTimeout> | null = null;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    private closeCheckTimeout: ReturnType<typeof setTimeout> | null = null;

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

    protected isWatching(type: StreamingWatchType, address: string): boolean {
        switch (type) {
            case 'balance':
                return this.balanceCallbacks.has(address);
            case 'transactions':
                return this.transactionCallbacks.has(address);
            case 'jettons':
                return this.jettonCallbacks.has(address);
            default:
                return false;
        }
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

    disconnect(): void {
        if (this.closeCheckTimeout) {
            clearTimeout(this.closeCheckTimeout);
            this.closeCheckTimeout = null;
        }
        this.stopReconnect();
        this.stopPing();
        this.reconnectAttempts = 0;
        const wasConnected = this.isConnected;
        if (this.ws) {
            this.ws.onclose = null;
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        if (wasConnected) {
            this.emitConnectionChange(false);
        }
        log.info('WebsocketStreamingProvider disconnected');
    }

    protected checkClose(): void {
        if (this.closeCheckTimeout) {
            clearTimeout(this.closeCheckTimeout);
        }
        this.closeCheckTimeout = setTimeout(() => {
            this.closeCheckTimeout = null;
            if (!this.hasActiveSubscriptions()) {
                this.disconnect();
            }
        }, 500);
    }

    connect(): void {
        this.ensureConnected();
    }

    onConnectionChange(callback: (connected: boolean) => void): () => void {
        this.connectionChangeCallbacks.add(callback);
        return () => {
            this.connectionChangeCallbacks.delete(callback);
        };
    }

    private emitConnectionChange(connected: boolean): void {
        this.connectionChangeCallbacks.forEach((cb) => cb(connected));
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
            this.emitConnectionChange(true);
        };

        this.ws.onmessage = this.onMessage.bind(this);

        this.ws.onerror = (error) => {
            log.error('WebSocket error', { readyState: this.ws?.readyState, error });
        };

        this.ws.onclose = () => {
            log.info('WebSocket closed');
            this.isConnected = false;
            this.stopPing();
            this.ws = null;
            this.emitConnectionChange(false);

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
        const schedulePing = () => {
            this.pingTimeout = setTimeout(() => {
                if (this.ws?.readyState === WebSocket.OPEN) {
                    const message = this.getPingMessage();
                    if (message) {
                        this.send(message);
                    }
                }
                schedulePing();
            }, 10000);
        };
        schedulePing();
    }

    protected stopPing(): void {
        if (this.pingTimeout) {
            clearTimeout(this.pingTimeout);
            this.pingTimeout = null;
        }
    }

    protected scheduleReconnect(): void {
        if (this.reconnectTimeout) return;

        this.reconnectAttempts++;
        const delays = WebsocketStreamingProvider.RECONNECT_DELAYS;
        const delayMs = delays[Math.min(this.reconnectAttempts - 1, delays.length - 1)];
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
     * Override to determine the ping payload sent every 10s.
     * If returns null, no ping is sent.
     */
    protected getPingMessage(): unknown | null {
        return null;
    }
}
