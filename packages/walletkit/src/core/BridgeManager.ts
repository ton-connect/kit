/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Bridge connection and communication management

import { SessionCrypto } from '@tonconnect/protocol';
import { BridgeProvider, ClientConnection, WalletConsumer } from '@tonconnect/bridge-sdk';

import type { BridgeConfig, BridgeEventBase, RawBridgeEvent, SessionData } from '../types/internal';
import { Storage } from '../storage';
import type { EventStore } from '../types/durableEvents';
import type { EventEmitter } from './EventEmitter';
import { globalLogger } from './Logger';
import { SessionManager } from './SessionManager';
import { EventRouter } from './EventRouter';
import {
    BridgeEventMessageInfo,
    InjectedToExtensionBridgeRequestPayload,
    JSBridgeTransportFunction,
    WalletInfo,
} from '../types/jsBridge';
import { uuidv7 } from '../utils/uuid';
import { WalletKitError, ERROR_CODES } from '../errors';
import { AnalyticsApi } from '../analytics/sender';
import { getUnixtime } from '../utils/time';
import { TonWalletKitOptions } from '../types/config';
import { getEventsSubsystem, getVersion } from '../utils/version';
import { TONCONNECT_BRIDGE_RESPONSE } from '../bridge/JSBridgeInjector';
import { getAddressFromWalletId } from '../utils/walletId';

const log = globalLogger.createChild('BridgeManager');

export class BridgeManager {
    private config: BridgeConfig;
    private bridgeProvider?: BridgeProvider<WalletConsumer>;
    private sessionManager: SessionManager;
    private storage: Storage;
    private isConnected = false;
    private reconnectAttempts = 0;
    private lastEventId?: string;
    private storageKey = 'bridge_last_event_id';
    private walletKitConfig: TonWalletKitOptions;
    private jsBridgeTransport?: JSBridgeTransportFunction;

    // Event processing queue and concurrency control
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private eventQueue: any[] = [];
    private isProcessing = false;

    // Durable events support
    private eventStore: EventStore;
    private eventRouter: EventRouter;
    private eventEmitter?: EventEmitter;
    private analyticsApi?: AnalyticsApi;

    private requestProcessingTimeoutId?: number;

    constructor(
        walletManifest: WalletInfo | undefined,
        config: BridgeConfig | undefined,
        sessionManager: SessionManager,
        storage: Storage,
        eventStore: EventStore,
        eventRouter: EventRouter,
        walletKitConfig: TonWalletKitOptions,
        eventEmitter?: EventEmitter,
        analyticsApi?: AnalyticsApi,
    ) {
        const isManifestJsBridge = walletManifest && 'jsBridgeKey' in walletManifest ? true : false;
        const manifestJsBridgeKey =
            walletManifest && 'jsBridgeKey' in walletManifest ? walletManifest.jsBridgeKey : undefined;
        const manifestBridgeUrl =
            walletManifest && 'bridgeUrl' in walletManifest ? walletManifest.bridgeUrl : undefined;

        this.config = {
            heartbeatInterval: 5000,
            reconnectInterval: 15000,
            maxReconnectAttempts: 5,
            ...{
                enableJsBridge: isManifestJsBridge,
                jsBridgeKey: manifestJsBridgeKey,
                bridgeUrl: manifestBridgeUrl,
            },
            ...config,
        };
        this.sessionManager = sessionManager;
        this.storage = storage;
        this.eventStore = eventStore;
        this.eventEmitter = eventEmitter;
        this.eventRouter = eventRouter;
        this.analyticsApi = analyticsApi;
        this.walletKitConfig = walletKitConfig;
        this.jsBridgeTransport = config?.jsBridgeTransport;

        if (!this.jsBridgeTransport && config?.enableJsBridge) {
            throw new WalletKitError(ERROR_CODES.INVALID_CONFIG, 'JS Bridge transport is not configured');
        }
    }

    /**
     * Initialize bridge connection
     */
    async start(): Promise<void> {
        if (this.bridgeProvider) {
            log.warn('Bridge already initialized');
            return;
        }

        try {
            await this.loadLastEventId();
            if (!this.config?.disableHttpConnection) {
                await this.connectToSSEBridge();
            } else {
                this.isConnected = true;
                this.reconnectAttempts = 0;
            }
        } catch (error) {
            log.error('Failed to start bridge', { error });
            throw error;
        }

        const requestProcessing = () => {
            this.processBridgeEvents();
            this.requestProcessingTimeoutId = setTimeout(requestProcessing, 1000) as unknown as number;
        };
        requestProcessing();
    }

    /**
     * Create new session for a dApp connection
     */
    async createSession(appSessionId: string): Promise<void> {
        // const walletSession = new SessionCrypto();
        // this.sessions.set(appSessionId, walletSession);
        log.info('[BRIDGE] Creating session', { appSessionId });

        const session = this.sessionManager.getSession(appSessionId);
        if (!session) {
            throw new WalletKitError(ERROR_CODES.SESSION_NOT_FOUND, `Session not found`, undefined, {
                appSessionId,
            });
        }

        // const sessionCrypto = new SessionCrypto({
        //     publicKey: session.publicKey,
        //     secretKey: session.privateKey,
        // });

        // const walletSession = new SessionCrypto();
        // this.sessions.set(appSessionId, walletSession);
        // If bridge is already connected, add this client
        if (this.bridgeProvider && this.isConnected) {
            log.info('[BRIDGE] Updating clients');
            await this.updateClients();
        }

        // return walletSession;
    }

    /**
     * Remove session
     */
    async removeSession(appSessionId: string): Promise<void> {
        // const session = this.sessions.get(appSessionId);
        // if (!session) {
        //     return;
        // }

        // this.sessions.delete(appSessionId);

        if (this.bridgeProvider && this.isConnected) {
            await this.updateClients();
        }
        log.debug('Session removed', { appSessionId });
    }

    /**
     * Send response to dApp
     */

    async sendResponse(
        event: BridgeEventBase,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response: any,
        _session?: SessionData,
    ): Promise<void> {
        if (event.isLocal) {
            return;
        }

        if (event.isJsBridge) {
            return this.sendJsBridgeResponse(
                event.tabId?.toString() || '',
                event.isJsBridge,
                event.messageId ?? null,
                response,
                {
                    traceId: event?.traceId,
                },
            );
        }

        if (!this.bridgeProvider) {
            throw new WalletKitError(ERROR_CODES.BRIDGE_NOT_INITIALIZED, 'Bridge not initialized for sending response');
        }

        const sessionId = event.from || event.sessionId;
        if (!sessionId) {
            throw new WalletKitError(
                ERROR_CODES.SESSION_ID_REQUIRED,
                'Session ID is required for sending response',
                undefined,
                { event: { id: event.id } },
            );
        }

        const session = _session ?? (await this.sessionManager.getSession(sessionId));
        if (!session) {
            throw new WalletKitError(ERROR_CODES.SESSION_NOT_FOUND, `Session not found for response`, undefined, {
                sessionId,
                eventId: event.id,
            });
        }

        try {
            const sessionCrypto = new SessionCrypto({
                publicKey: session.publicKey,
                secretKey: session.privateKey,
            });
            await this.bridgeProvider.send(response, sessionCrypto, sessionId, {
                traceId: event?.traceId,
            });

            log.debug('Response sent successfully', { sessionId: sessionId, requestId: event.id });
        } catch (error) {
            log.error('Failed to send response through bridge', {
                sessionId: sessionId,
                requestId: event.id,
                error,
            });
            throw WalletKitError.fromError(
                ERROR_CODES.BRIDGE_RESPONSE_SEND_FAILED,
                'Failed to send response through bridge',
                error,
                { sessionId, requestId: event.id },
            );
        }
    }

    async sendJsBridgeResponse(
        sessionId: string,
        _isJsBridge: boolean,
        requestId: string | null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response: any,
        options?: {
            traceId?: string;
            session?: SessionData;
        },
    ): Promise<void> {
        const source = this.config.jsBridgeKey + '-tonconnect';
        const message = {
            type: TONCONNECT_BRIDGE_RESPONSE,
            source: source,
            messageId: requestId,
            success: true,
            payload: response,
            traceId: options?.traceId,
        };

        if (this.jsBridgeTransport) {
            try {
                await this.jsBridgeTransport(sessionId, message);
            } catch (e) {
                // eslint-disable-next-line no-console
                console.error('Failed to send response through JS Bridge', { error: e });
            }
        } else {
            throw new WalletKitError(ERROR_CODES.INVALID_CONFIG, 'JS Bridge transport is not configured');
        }

        // Fire disconnect event on emit (not inside bridge event handler)
        // if (response?.event === 'disconnect' && options?.session) {
        //     const session = options.session;
        //     const disconnectEvent: RawBridgeEvent = {
        //         id: response.id || crypto.randomUUID(),
        //         method: 'disconnect',
        //         params: response.payload || {},
        //         timestamp: Date.now(),
        //         from: sessionId,
        //         domain: session.domain,
        //         isJsBridge: true,
        //         walletAddress: session.walletAddress,
        //         dAppInfo: {
        //             name: session.dAppName,
        //             description: session.dAppDescription,
        //             url: session.dAppIconUrl,
        //             iconUrl: session.dAppIconUrl,
        //         },
        //         traceId: options.traceId,
        //     };
        //     await this.eventRouter.routeEvent(disconnectEvent);
        // }
    }

    /**
     * Close bridge connection
     */
    async close(): Promise<void> {
        if (this.bridgeProvider) {
            await this.bridgeProvider.close();
            this.bridgeProvider = undefined;
        }

        // Clear event queue and reset processing state
        this.eventQueue = [];
        this.isProcessing = false;

        // this.sessions.clear();
        this.isConnected = false;
        this.reconnectAttempts = 0;
        if (this.requestProcessingTimeoutId) {
            clearTimeout(this.requestProcessingTimeoutId);
            this.requestProcessingTimeoutId = undefined;
        }
    }

    /**
     * Get connection status
     */
    isConnectedToBridge(): boolean {
        return this.isConnected;
    }

    /**
     * Get active session count
     */
    // getSessionCount(): number {
    //     return this.sessions.size;
    // }

    private async getClients(): Promise<ClientConnection[]> {
        return this.sessionManager.getSessions().map((session) => ({
            session: new SessionCrypto({
                publicKey: session.publicKey,
                secretKey: session.privateKey.length > 64 ? session.privateKey.slice(0, 64) : session.privateKey,
            }),
            clientId: session.sessionId,
        }));
    }

    /**
     * Connect to TON Connect bridge
     */
    private async connectToSSEBridge(): Promise<void> {
        if (!this.config.bridgeUrl) {
            return;
        }

        const connectTraceId = uuidv7();
        try {
            // Prepare clients array for existing sessions
            const clients = await this.getClients();
            if (clients.length === 0) {
                clients.push({
                    clientId: '0',
                    session: new SessionCrypto(),
                });
            }

            // Send bridge-client-connect-started event
            this.analyticsApi?.sendEvents([
                {
                    event_name: 'bridge-connect-started',
                    client_environment: 'wallet',
                    subsystem: getEventsSubsystem(),
                    bridge_url: this.config.bridgeUrl,
                    client_timestamp: getUnixtime(),
                    event_id: uuidv7(),
                    trace_id: connectTraceId,
                    version: getVersion(),
                },
            ]);

            this.bridgeProvider = await BridgeProvider.open<WalletConsumer>({
                bridgeUrl: this.config.bridgeUrl,
                clients,
                listener: this.queueBridgeEvent.bind(this),
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                errorListener: (error: any) => {
                    log.error('Bridge listener error', { error: error.toString() });
                    // Send bridge-client-connect-error event for listener errors
                    this.analyticsApi?.sendEvents([
                        {
                            event_name: 'bridge-connect-error',
                            client_environment: 'wallet',
                            subsystem: getEventsSubsystem(),
                            bridge_url: this.config.bridgeUrl,
                            error_message: error?.toString() || 'Unknown error',
                            event_id: uuidv7(),
                            trace_id: error?.traceId ?? connectTraceId,
                            version: getVersion(),
                            client_id: error?.clientId,
                            client_timestamp: getUnixtime(),
                            error_code: error?.errorCode,
                        },
                    ]);
                },
                options: {
                    lastEventId: this.lastEventId,
                    // heartbeatReconnectIntervalMs: this.config.reconnectInterval,
                },
            });
            this.isConnected = true;
            this.reconnectAttempts = 0;
            log.info('Bridge connected successfully');

            // Send bridge-client-connect-established event
            this.analyticsApi?.sendEvents([
                {
                    event_name: 'bridge-connect-established',
                    client_environment: 'wallet',
                    subsystem: getEventsSubsystem(),
                    bridge_url: this.config.bridgeUrl,
                    client_timestamp: getUnixtime(),
                    event_id: uuidv7(),
                    trace_id: connectTraceId,
                    version: getVersion(),
                },
            ]);
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            log.error('Bridge connection failed', { error: error?.toString() });

            // Send bridge-client-connect-error event
            this.analyticsApi?.sendEvents([
                {
                    event_name: 'bridge-connect-error',
                    client_environment: 'wallet',
                    subsystem: getEventsSubsystem(),
                    bridge_url: this.config.bridgeUrl,
                    error_message: error?.toString() || 'Unknown error',
                    event_id: uuidv7(),
                    trace_id: error?.traceId ?? connectTraceId,
                    version: getVersion(),
                    client_id: error?.clientId,
                    client_timestamp: getUnixtime(),
                    error_code: error?.errorCode,
                },
            ]);

            if (!this.config.disableHttpConnection) {
                // Attempt reconnection if not at max attempts
                if (this.reconnectAttempts < (this.config.maxReconnectAttempts || 5)) {
                    this.reconnectAttempts++;
                    log.info('Bridge reconnection attempt', { attempt: this.reconnectAttempts });
                    setTimeout(() => {
                        this.connectToSSEBridge().catch((error) => log.error('Bridge reconnection failed', { error }));
                    }, this.config.reconnectInterval);
                }
            }
            throw WalletKitError.fromError(ERROR_CODES.BRIDGE_CONNECTION_FAILED, 'Failed to connect to bridge', error, {
                reconnectAttempts: this.reconnectAttempts,
                bridgeUrl: this.config.bridgeUrl,
            });
        }
    }

    /**
     * Restart bridge connection in case of error, so we can receive events again
     */
    private async restartConnection(): Promise<void> {
        await this.close();
        await this.start();
    }

    /**
     * Add client to existing bridge connection
     */
    private async updateClients(): Promise<void> {
        log.debug('Updating clients');
        if (this.bridgeProvider) {
            const clients = await this.getClients();
            log.info('[BRIDGE] Restoring connection', { clients: clients.length });
            await this.bridgeProvider.restoreConnection(clients, {
                lastEventId: this.lastEventId,
            });
        }
    }

    /**
     * Queue incoming bridge events for processing
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private queueBridgeEvent(event: any): void {
        log.debug('Bridge event queued', { eventId: event?.id, event });
        this.eventQueue.push(event);

        // Trigger processing (don't wait for it to complete)
        this.processBridgeEvents().catch((error) => {
            log.error('Error in background event processing', { error });
        });
    }

    public queueJsBridgeEvent(
        messageInfo: BridgeEventMessageInfo,
        event: InjectedToExtensionBridgeRequestPayload,
    ): void {
        log.debug('JS Bridge event queued', { eventId: messageInfo?.messageId });

        // Todo validate event
        if (!event) {
            return;
        }

        if (!event.traceId) {
            event.traceId = uuidv7();
        }

        if (event.method == 'connect') {
            this.eventQueue.push({
                ...event,
                isJsBridge: true,
                tabId: messageInfo.tabId,
                domain: messageInfo.domain,
                messageId: messageInfo.messageId,
            });
        } else if (event.method == 'restoreConnection') {
            this.eventEmitter?.emit('restoreConnection', {
                ...event,
                tabId: messageInfo.tabId,
                domain: messageInfo.domain,
                messageId: messageInfo.messageId,
            });
        } else if (event.method == 'send' && event?.params?.length === 1) {
            this.eventQueue.push({
                ...event,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                ...(event as any).params[0],
                isJsBridge: true,
                tabId: messageInfo.tabId,
                domain: messageInfo.domain,
                messageId: messageInfo.messageId,
            });
        }

        // Trigger processing (don't wait for it to complete)
        this.processBridgeEvents().catch((error) => {
            log.error('Error in background event processing', { error });
        });
    }

    /**
     * Process events from the queue with concurrency control
     * New events from the bridge added to eventQueue to avoid concurrency
     * processBridgeEvents takes events from queue one by one and tries to store them durably
     * if event stored successfully, we will update lastEventId and proceed to the next event
     * if we've encountered error, bridge connection we be restarted from last success id, so we should try to process same event again
     */
    private async processBridgeEvents(): Promise<void> {
        // Ensure only one processing instance runs at a time
        if (this.isProcessing) {
            log.debug('Event processing already in progress, skipping');
            return;
        }

        this.isProcessing = true;

        try {
            // Process all events in FIFO order
            while (this.eventQueue.length > 0) {
                const event = this.eventQueue.shift();
                if (event) {
                    // Important: set isLocal to false for all events from bridge
                    event.isLocal = false;
                    await this.handleBridgeEvent(event);
                }
            }
        } catch (error) {
            log.error('Error during event processing', { error });
            this.isProcessing = false;
            this.restartConnection();
            return;
        } finally {
            this.isProcessing = false;
        }
    }

    /**
     * Handle individual bridge event (original processing logic)
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private async handleBridgeEvent(event: any): Promise<void> {
        try {
            log.info('Bridge event received', { event });
            // Convert bridge event to our internal format
            const rawEvent: RawBridgeEvent = {
                id: event.id || crypto.randomUUID(),
                method: event.method || 'unknown',
                params: event.params || event,
                // sessionId: event.from,
                timestamp: Date.now(),
                from: event?.from,
                domain: event?.domain,
                isJsBridge: event?.isJsBridge,
                tabId: event?.tabId,
                messageId: event?.messageId,
                traceId: event?.traceId,
            };

            if (!rawEvent.traceId) {
                rawEvent.traceId = uuidv7();
            }

            await this.sessionManager.initialize();
            if (rawEvent.from) {
                const session = await this.sessionManager.getSession(rawEvent.from);
                rawEvent.domain = session?.domain || '';
                if (session) {
                    if (session?.walletId) {
                        rawEvent.walletId = session.walletId;
                        rawEvent.walletAddress = getAddressFromWalletId(session.walletId);
                    }

                    rawEvent.dAppInfo = {
                        name: session.dAppName,
                        description: session.dAppDescription,
                        url: session.dAppIconUrl,
                        iconUrl: session.dAppIconUrl,
                    };
                }
            } else if (rawEvent.domain) {
                const session = await this.sessionManager.getSessionByDomain(rawEvent.domain);
                if (session?.walletId) {
                    rawEvent.walletId = session.walletId;
                    rawEvent.walletAddress = getAddressFromWalletId(session.walletId);
                }

                if (session?.sessionId) {
                    rawEvent.from = session.sessionId;
                }

                if (session) {
                    rawEvent.dAppInfo = {
                        name: session.dAppName,
                        description: session.dAppDescription,
                        url: session.dAppIconUrl,
                        iconUrl: session.dAppIconUrl,
                    };

                    if (!rawEvent.from) {
                        rawEvent.from = session.sessionId;
                    }
                }
            }

            // Store event durably if enabled
            if (!this.eventStore) {
                throw new WalletKitError(ERROR_CODES.EVENT_STORE_NOT_INITIALIZED, 'Event store is not initialized');
            }
            try {
                await this.eventStore.storeEvent(rawEvent);

                // Notify that bridge storage was updated
                if (this.eventEmitter) {
                    this.eventEmitter.emit('bridge-storage-updated');
                }

                log.info('Event stored durably', { eventId: rawEvent.id, method: rawEvent.method });
            } catch (error) {
                log.error('Failed to store event durably', {
                    eventId: rawEvent.id,
                    error: (error as Error).message,
                });

                throw WalletKitError.fromError(
                    ERROR_CODES.EVENT_STORE_OPERATION_FAILED,
                    'Failed to store event durably',
                    error,
                    { eventId: rawEvent.id, method: rawEvent.method },
                );
            }

            log.info('Bridge event processed', { rawEvent });

            // Update and persist last event ID
            if (event?.lastEventId && event.lastEventId !== this.lastEventId) {
                this.lastEventId = event.lastEventId;
                await this.saveLastEventId();
            }
        } catch (error) {
            log.error('Error handling bridge event', { error });
        }
    }

    /**
     * Load last event ID from storage
     */
    private async loadLastEventId(): Promise<void> {
        try {
            const savedEventId = await this.storage.get<string>(this.storageKey);
            if (savedEventId) {
                this.lastEventId = savedEventId;
                log.debug('Loaded last event ID from storage', { lastEventId: this.lastEventId });
            }
        } catch (error) {
            const storageError = WalletKitError.fromError(
                ERROR_CODES.STORAGE_READ_FAILED,
                'Failed to load last event ID from storage',
                error,
            );
            log.warn('Failed to load last event ID from storage', { error: storageError });
        }
    }

    /**
     * Save last event ID to storage
     */
    private async saveLastEventId(): Promise<void> {
        try {
            if (this.lastEventId) {
                await this.storage.set(this.storageKey, this.lastEventId);
                log.debug('Saved last event ID to storage', { lastEventId: this.lastEventId });
            }
        } catch (error) {
            const storageError = WalletKitError.fromError(
                ERROR_CODES.STORAGE_WRITE_FAILED,
                'Failed to save last event ID to storage',
                error,
            );
            log.warn('Failed to save last event ID to storage', { error: storageError });
        }
    }
}
