// Bridge connection and communication management

import { SessionCrypto } from '@tonconnect/protocol';
import { BridgeProvider, ClientConnection, WalletConsumer } from '@tonconnect/bridge-sdk';

import type { BridgeConfig, RawBridgeEvent, StorageAdapter } from '../types/internal';
import type { EventStore } from '../types/durableEvents';
import type { EventEmitter } from './EventEmitter';
import { globalLogger } from './Logger';
import { SessionManager } from './SessionManager';
import { EventRouter } from './EventRouter';

const log = globalLogger.createChild('BridgeManager');

export class BridgeManager {
    private config: BridgeConfig;
    private bridgeProvider?: BridgeProvider<WalletConsumer>;
    private sessionManager: SessionManager;
    private storageAdapter: StorageAdapter;
    private isConnected = false;
    private reconnectAttempts = 0;
    private lastEventId?: string;
    private storageKey = 'bridge_last_event_id';

    // Event processing queue and concurrency control
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private eventQueue: any[] = [];
    private isProcessing = false;

    // Durable events support
    private eventStore: EventStore;
    private eventRouter: EventRouter;
    private eventEmitter?: EventEmitter;

    private requestProcessingTimeoutId?: number;

    constructor(
        config: BridgeConfig,
        sessionManager: SessionManager,
        storageAdapter: StorageAdapter,
        eventStore: EventStore,
        eventRouter: EventRouter,
        eventEmitter?: EventEmitter,
    ) {
        this.config = {
            heartbeatInterval: 5000,
            reconnectInterval: 15000,
            maxReconnectAttempts: 5,
            ...config,
        };
        this.sessionManager = sessionManager;
        this.storageAdapter = storageAdapter;
        this.eventStore = eventStore;
        this.eventEmitter = eventEmitter;
        this.eventRouter = eventRouter;
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
            await this.connectToSSEBridge();
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
            throw new Error(`Session ${appSessionId} not found`);
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async sendResponse(sessionId: string, isJsBridge: boolean, requestId: string | null, response: any): Promise<void> {
        if (!this.bridgeProvider) {
            throw new Error('Bridge not initialized');
        }

        if (isJsBridge) {
            return this.sendJsBridgeResponse(sessionId, isJsBridge, requestId, response);
        }

        const session = await this.sessionManager.getSession(sessionId);
        if (!session) {
            throw new Error(`Session ${sessionId} not found`);
        }

        try {
            const sessionCrypto = new SessionCrypto({
                publicKey: session.publicKey,
                secretKey: session.privateKey,
            });
            await this.bridgeProvider.send(response, sessionCrypto, sessionId);

            log.debug('Response sent successfully', { sessionId, requestId });
        } catch (error) {
            log.error('Failed to send response through bridge', {
                sessionId,
                requestId,
                error,
            });
            throw error;
        }
    }

    async sendJsBridgeResponse(
        sessionId: string,
        _isJsBridge: boolean,
        requestId: string | null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        response: any,
    ): Promise<void> {
        if (!this.bridgeProvider) {
            throw new Error('Bridge not initialized');
        }

        const source = this.config.bridgeName + '-tonconnect';
        // eslint-disable-next-line no-undef
        chrome.tabs.sendMessage(parseInt(sessionId), {
            type: 'TONCONNECT_BRIDGE_RESPONSE',
            source: source,
            messageId: requestId,
            success: true,
            payload: response,
        });

        // await this.bridgeProvider.send(response, sessionCrypto, sessionId);
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

        try {
            // Prepare clients array for existing sessions
            const clients = await this.getClients();
            if (clients.length === 0) {
                clients.push({
                    clientId: '0',
                    session: new SessionCrypto(),
                });
            }
            this.bridgeProvider = await BridgeProvider.open<WalletConsumer>({
                bridgeUrl: this.config.bridgeUrl,
                clients,
                listener: this.queueBridgeEvent.bind(this),
                options: {
                    lastEventId: this.lastEventId,
                    // heartbeatReconnectIntervalMs: this.config.reconnectInterval,
                },
            });
            this.isConnected = true;
            this.reconnectAttempts = 0;
            log.info('Bridge connected successfully');
        } catch (error) {
            log.error('Bridge connection failed', { error });
            // Attempt reconnection if not at max attempts
            if (this.reconnectAttempts < (this.config.maxReconnectAttempts || 5)) {
                this.reconnectAttempts++;
                log.info('Bridge reconnection attempt', { attempt: this.reconnectAttempts });
                setTimeout(() => {
                    this.connectToSSEBridge().catch((error) => log.error('Bridge reconnection failed', { error }));
                }, this.config.reconnectInterval);
            }
            throw error;
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
        log.debug('Bridge event queued', { eventId: event?.id });
        this.eventQueue.push(event);

        // Trigger processing (don't wait for it to complete)
        this.processBridgeEvents().catch((error) => {
            log.error('Error in background event processing', { error });
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    public queueJsBridgeEvent(event: any): void {
        log.debug('JS Bridge event queued', { eventId: event?.id });

        if (event.method == 'connect') {
            this.eventQueue.push({
                ...event,
                isJsBridge: true,
                tabId: event.tabId,
                domain: event.domain,
            });
        } else if (event.method == 'restoreConnection') {
            this.eventEmitter?.emit('restoreConnection', event);
            // this.eventQueue.push({
            //     ...event,
            //     isJsBridge: true,
            //     tabId: event.tabId,
            //     domain: event.domain,
            // });
        } else if (event.method == 'send' && event?.params?.length === 1) {
            this.eventQueue.push({
                ...event,
                ...event.params[0],
                id: event.id,
                isJsBridge: true,
                tabId: event.tabId,
                domain: event.domain,
            });
        }

        // Trigger processing (don't wait for it to complete)
        this.processBridgeEvents().catch((error) => {
            log.error('Error in background event processing', { error });
        });
    }

    /**
     * Process events from the queue with concurrency control
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
            };

            if (rawEvent.from) {
                const session = await this.sessionManager.getSession(rawEvent.from);
                rawEvent.domain = session?.domain || '';
                if (session?.wallet) {
                    rawEvent.wallet = session.wallet;
                }
                if (session?.walletAddress) {
                    rawEvent.walletAddress = session.walletAddress;
                }
            } else if (rawEvent.domain) {
                const session = await this.sessionManager.getSessionByDomain(rawEvent.domain);
                if (session?.wallet) {
                    rawEvent.wallet = session.wallet;
                }
                if (session?.walletAddress) {
                    rawEvent.walletAddress = session.walletAddress;
                }

                if (session?.sessionId) {
                    rawEvent.from = session.sessionId;
                }
            }

            // Store event durably if enabled
            if (!this.eventStore) {
                throw new Error('Event store is not initialized');
            }
            try {
                await this.eventStore.storeEvent(rawEvent);

                // Notify that bridge storage was updated
                if (this.eventEmitter) {
                    this.eventEmitter.emit('bridge-storage-updated');
                }

                log.info('Event stored durably', { eventId: rawEvent.id, method: rawEvent.method });

                // todo - fire on emit, not inside bridge
                if (rawEvent.method == 'connect') {
                    await this.eventRouter.routeEvent(rawEvent);
                }
            } catch (error) {
                log.error('Failed to store event durably', {
                    eventId: rawEvent.id,
                    error: (error as Error).message,
                });

                throw error;
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
            const savedEventId = await this.storageAdapter.get<string>(this.storageKey);
            if (savedEventId) {
                this.lastEventId = savedEventId;
                log.debug('Loaded last event ID from storage', { lastEventId: this.lastEventId });
            }
        } catch (error) {
            log.warn('Failed to load last event ID from storage', { error });
        }
    }

    /**
     * Save last event ID to storage
     */
    private async saveLastEventId(): Promise<void> {
        try {
            if (this.lastEventId) {
                await this.storageAdapter.set(this.storageKey, this.lastEventId);
                log.debug('Saved last event ID to storage', { lastEventId: this.lastEventId });
            }
        } catch (error) {
            log.warn('Failed to save last event ID to storage', { error });
        }
    }
}
