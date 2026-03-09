/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Network } from '../api/models';
import { globalLogger } from './Logger';
import type {
    StreamingV2Event,
    StreamingV2SubscriptionRequest,
    StreamingV2TransactionsNotification,
    StreamingV2ActionsNotification,
    StreamingV2AccountStateNotification,
    StreamingV2JettonsNotification,
    StreamingV2TraceInvalidatedNotification,
    StreamingV2TransactionRaw,
} from '../types/toncenter/streaming-v2';
import { toToncenterTransaction } from '../types/toncenter/streaming-v2';

const log = globalLogger.createChild('ToncenterWebSocketClient');

const WS_PATH = '/api/streaming/v2/ws';

export interface WebSocketSubscriptionConfig {
    addresses: string[];
    types: ('transactions' | 'actions' | 'account_state_change' | 'jettons_change' | 'trace')[];
    minFinality?: 'pending' | 'confirmed' | 'finalized';
    traceExternalHashNorms?: string[];
    includeAddressBook?: boolean;
    includeMetadata?: boolean;
    actionTypes?: string[];
}

export interface TransactionEvent {
    type: 'transactions';
    finality: string;
    trace_external_hash_norm: string;
    transactions: unknown[];
    address_book?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

export interface ActionEvent {
    type: 'actions';
    finality: string;
    trace_external_hash_norm: string;
    actions: unknown[];
    address_book?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

export interface AccountStateChangeEvent {
    type: 'account_state_change';
    finality: string;
    account: string;
    state: {
        hash: string;
        balance: string;
        account_status: string;
        data_hash: string;
        code_hash: string;
    };
}

export interface JettonChangeEvent {
    type: 'jettons_change';
    finality: string;
    jetton: {
        address: string;
        balance: string;
        owner: string;
        jetton: string;
        last_transaction_lt: string;
    };
    address_book?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}

export interface TraceInvalidatedEvent {
    type: 'trace_invalidated';
    trace_external_hash_norm: string;
}

export interface WebSocketEventHandlers {
    onTransaction?: (event: TransactionEvent) => void;
    onAction?: (event: ActionEvent) => void;
    onAccountStateChange?: (event: AccountStateChangeEvent) => void;
    onJettonChange?: (event: JettonChangeEvent) => void;
    onTraceInvalidated?: (event: TraceInvalidatedEvent) => void;
    onError?: (error: Error) => void;
    onConnect?: () => void;
    onDisconnect?: () => void;
}

export interface ToncenterWebSocketClientConfig {
    endpoint?: string;
    apiKey?: string;
    network?: Network;
}

export class ToncenterWebSocketClient {
    private static instance: ToncenterWebSocketClient | null = null;
    private ws: WebSocket | null = null;
    private config: WebSocketSubscriptionConfig | null = null;
    private handlers: WebSocketEventHandlers | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 50;
    private reconnectDelay = 300;
    private isConnected = false;
    private baseUrl: string;
    private apiKey?: string;
    private network?: Network;
    private pingInterval: ReturnType<typeof setInterval> | null = null;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;

    private constructor(config?: ToncenterWebSocketClientConfig) {
        const network = config?.network;
        const base =
            config?.endpoint ??
            (network?.chainId === Network.mainnet().chainId ? 'wss://toncenter.com' : 'wss://testnet.toncenter.com');
        this.baseUrl = base.replace(/\/$/, '') + WS_PATH;
        this.apiKey = config?.apiKey;
        this.network = network;
        log.info('ToncenterWebSocketClient instance created', { baseUrl: this.baseUrl });
    }

    static getInstance(config?: ToncenterWebSocketClientConfig): ToncenterWebSocketClient {
        if (!ToncenterWebSocketClient.instance) {
            ToncenterWebSocketClient.instance = new ToncenterWebSocketClient(config);
            log.info('Created new ToncenterWebSocketClient singleton instance');
        } else if (config) {
            ToncenterWebSocketClient.instance.updateConfig(config);
        }
        return ToncenterWebSocketClient.instance;
    }

    updateConfig(config: ToncenterWebSocketClientConfig): void {
        if (config.apiKey !== undefined) {
            this.apiKey = config.apiKey;
        }
        if (config.network !== undefined) {
            this.network = config.network;
        }
        if (config.endpoint !== undefined) {
            const base = config.endpoint.replace(/\/$/, '').replace(/^https?/, 'wss');
            this.baseUrl = base + WS_PATH;
        } else if (config.network !== undefined) {
            const base =
                config.network.chainId === Network.mainnet().chainId
                    ? 'wss://toncenter.com'
                    : 'wss://testnet.toncenter.com';
            this.baseUrl = base + WS_PATH;
        }
    }

    subscribe(config: WebSocketSubscriptionConfig, handlers: WebSocketEventHandlers): Promise<void> {
        this.config = config;
        this.handlers = handlers;

        return new Promise((resolve, reject) => {
            try {
                this.connect(resolve, reject);
            } catch (error) {
                log.error('Failed to subscribe:', { error });
                handlers.onError?.(error as Error);
                reject(error);
            }
        });
    }

    unsubscribe(): void {
        this.disconnect();
        this.config = null;
        this.handlers = null;
    }

    private getUrl(): string {
        let url = this.baseUrl;
        if (this.apiKey) {
            const separator = url.includes('?') ? '&' : '?';
            url += `${separator}api_key=${encodeURIComponent(this.apiKey)}`;
        }
        return url;
    }

    private connect(resolve?: () => void, reject?: (err: Error) => void): void {
        if (!this.config || !this.handlers) {
            reject?.(new Error('No subscription config or handlers'));
            return;
        }

        if (this.ws) {
            this.ws.onopen = null;
            this.ws.onmessage = null;
            this.ws.onerror = null;
            this.ws.onclose = null;
            this.ws.close();
            this.ws = null;
        }

        const url = this.getUrl();
        const safeUrl = this.apiKey ? url.replace(this.apiKey, '***') : url;
        log.info('Connecting to WebSocket', { url: safeUrl, hasApiKey: !!this.apiKey });

        try {
            this.ws = new WebSocket(url);
        } catch (error) {
            log.error('WebSocket constructor failed', { error });
            this.handlers?.onError?.(error as Error);
            reject?.(error as Error);
            return;
        }

        this.ws.onopen = () => {
            log.info('WebSocket connected');
            this.isConnected = true;
            this.reconnectAttempts = 0;

            const requestBody: StreamingV2SubscriptionRequest = {
                addresses: this.config!.addresses,
                types: this.config!.types,
                min_finality: this.config!.minFinality ?? 'pending',
                include_address_book: this.config!.includeAddressBook ?? true,
                include_metadata: this.config!.includeMetadata ?? false,
                ...(this.config!.traceExternalHashNorms?.length && {
                    trace_external_hash_norms: this.config!.traceExternalHashNorms,
                }),
                ...(this.config!.actionTypes?.length && {
                    action_types: this.config!.actionTypes,
                }),
            };

            const subscribePayload = JSON.stringify({
                operation: 'subscribe',
                id: `sub-${Date.now()}`,
                ...requestBody,
            });

            const sendSubscribe = () => {
                if (this.ws?.readyState === WebSocket.OPEN) {
                    this.ws.send(subscribePayload);
                    this.startPing();
                }
            };

            try {
                sendSubscribe();
            } catch {
                setTimeout(sendSubscribe, 0);
            }

            this.handlers?.onConnect?.();
            resolve?.();
        };

        this.ws.onmessage = (event: MessageEvent) => {
            try {
                const msg = JSON.parse(event.data as string) as Record<string, unknown>;
                const status = msg['status'] as string | undefined;
                if (status === 'subscribed' || status === 'pong') {
                    return;
                }

                const type = msg['type'] as string | undefined;
                if (!type) return;

                this.handleEvent(msg as unknown as StreamingV2Event);
            } catch (err) {
                log.warn('Failed to parse WebSocket message', { error: err });
            }
        };

        this.ws.onerror = (event: Event) => {
            log.error('WebSocket error', { event });
            this.handlers?.onError?.(new Error('WebSocket error'));
        };

        this.ws.onclose = (event: CloseEvent) => {
            log.info('WebSocket closed', { code: event.code, reason: event.reason });
            this.isConnected = false;
            this.stopPing();
            this.ws = null;
            this.handlers?.onDisconnect?.();

            if (this.config && this.reconnectAttempts < this.maxReconnectAttempts) {
                this.scheduleReconnect();
            }
        };
    }

    private handleEvent(event: StreamingV2Event): void {
        log.debug('Received WebSocket event:', { type: event.type });

        switch (event.type) {
            case 'transactions': {
                const txEvent = event as StreamingV2TransactionsNotification;
                const transactions = txEvent.transactions.map((raw) =>
                    toToncenterTransaction(raw as StreamingV2TransactionRaw, txEvent.trace_external_hash_norm),
                );
                this.handlers?.onTransaction?.({
                    type: 'transactions',
                    finality: txEvent.finality,
                    trace_external_hash_norm: txEvent.trace_external_hash_norm,
                    transactions,
                    address_book: txEvent.address_book,
                    metadata: txEvent.metadata,
                });
                break;
            }
            case 'actions': {
                const actionEvent = event as StreamingV2ActionsNotification;
                this.handlers?.onAction?.({
                    type: 'actions',
                    finality: actionEvent.finality,
                    trace_external_hash_norm: actionEvent.trace_external_hash_norm,
                    actions: actionEvent.actions,
                    address_book: actionEvent.address_book,
                    metadata: actionEvent.metadata,
                });
                break;
            }
            case 'account_state_change': {
                const stateEvent = event as StreamingV2AccountStateNotification;
                this.handlers?.onAccountStateChange?.({
                    type: 'account_state_change',
                    finality: stateEvent.finality,
                    account: stateEvent.account,
                    state: stateEvent.state,
                });
                break;
            }
            case 'jettons_change': {
                const jettonEvent = event as StreamingV2JettonsNotification;
                this.handlers?.onJettonChange?.({
                    type: 'jettons_change',
                    finality: jettonEvent.finality,
                    jetton: jettonEvent.jetton,
                    address_book: jettonEvent.address_book,
                    metadata: jettonEvent.metadata,
                });
                break;
            }
            case 'trace_invalidated': {
                const invEvent = event as StreamingV2TraceInvalidatedNotification;
                this.handlers?.onTraceInvalidated?.({
                    type: 'trace_invalidated',
                    trace_external_hash_norm: invEvent.trace_external_hash_norm,
                });
                break;
            }
            default:
                log.warn('Unknown WebSocket event type:', { type: (event as { type?: string }).type });
        }
    }

    private startPing(): void {
        this.stopPing();
        this.pingInterval = setInterval(() => {
            if (this.ws?.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ operation: 'ping', id: `ping-${Date.now()}` }));
            }
        }, 15000);
    }

    private stopPing(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }

    private scheduleReconnect(): void {
        if (this.reconnectTimeout) return;

        this.reconnectAttempts++;
        const maxDelayMs = 5000;
        const delayMs = Math.min(this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1), maxDelayMs);

        log.info(`Reconnecting in ${delayMs}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

        this.reconnectTimeout = setTimeout(() => {
            this.reconnectTimeout = null;
            if (this.config && this.handlers) {
                this.connect();
            }
        }, delayMs);
    }

    disconnect(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        this.stopPing();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.reconnectAttempts = 0;
        log.info('Disconnected from WebSocket stream');
        this.handlers?.onDisconnect?.();
    }

    isConnectedToStream(): boolean {
        return this.isConnected;
    }
}

let globalWebSocketClient: ToncenterWebSocketClient | null = null;

export function getGlobalWebSocketClient(config?: ToncenterWebSocketClientConfig): ToncenterWebSocketClient {
    const client = ToncenterWebSocketClient.getInstance(config);
    if (!globalWebSocketClient) {
        globalWebSocketClient = client;
        log.info('Created global WebSocket client singleton');
    }
    return client;
}
