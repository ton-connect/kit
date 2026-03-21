/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { globalLogger } from '../core/Logger';
import type { StreamingProvider, StreamingProviderListener } from './StreamingProvider';
import { asAddressFriendly } from '../utils';

const log = globalLogger.createChild('WebsocketStreamingProvider');

export abstract class WebsocketStreamingProvider implements StreamingProvider {
    protected ws: WebSocket | null = null;
    protected isConnected = false;
    protected listener: StreamingProviderListener;
    protected getWatchers: () => Map<string, Set<string>>;

    private reconnectAttempts = 0;
    private maxReconnectAttempts = 50;
    private reconnectDelay = 300;
    private pingInterval: ReturnType<typeof setInterval> | null = null;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    constructor(listener: StreamingProviderListener, getWatchers: () => Map<string, Set<string>>) {
        this.listener = listener;
        this.getWatchers = getWatchers;
    }

    // Abstract methods to be implemented by children
    protected abstract getUrl(): string;
    protected abstract onMessage(event: MessageEvent): void;
    protected abstract fullResync(): void;
    protected abstract onWatch(type: string, id: string): void;
    protected abstract onUnwatch(type: string, id: string): void;

    protected hasActiveSubscriptions(): boolean {
        const watched = this.getWatchers();
        for (const set of watched.values()) {
            if (set.size > 0) return true;
        }
        return false;
    }

    watchBalance(address: string): void {
        this.onWatch('balance', address);
        this.ensureConnected();
    }

    unwatchBalance(address: string): void {
        const friendly = asAddressFriendly(address);
        this.onUnwatch('balance', friendly);
        this.checkClose();
    }

    watchTransactions(address: string): void {
        this.onWatch('transactions', address);
        this.ensureConnected();
    }

    unwatchTransactions(address: string): void {
        const friendly = asAddressFriendly(address);
        this.onUnwatch('transactions', friendly);
        this.checkClose();
    }

    watchJettons(address: string): void {
        this.onWatch('jettons', address);
        this.ensureConnected();
    }

    unwatchJettons(address: string): void {
        const friendly = asAddressFriendly(address);
        this.onUnwatch('jettons', friendly);
        this.checkClose();
    }

    watchTraces(address: string): void {
        this.onWatch('traces', address);
        this.ensureConnected();
    }

    unwatchTraces(address: string): void {
        const friendly = asAddressFriendly(address);
        this.onUnwatch('traces', friendly);
        this.checkClose();
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

    protected ensureConnected(): void {
        if (this.isConnected || this.ws?.readyState === WebSocket.CONNECTING) {
            return;
        }
        this.connect();
    }

    private connect(): void {
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
            this.connect();
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
