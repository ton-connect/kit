// Bridge connection and communication management

import { SessionCrypto } from '@tonconnect/protocol';
import { BridgeProvider, ClientConnection, WalletConsumer } from 'bridge-sdk';

import type { BridgeConfig, RawBridgeEvent, EventCallback, StorageAdapter } from '../types/internal';
import { globalLogger } from './Logger';
import { SessionManager } from './SessionManager';

const log = globalLogger.createChild('BridgeManager');

export class BridgeManager {
    private config: BridgeConfig;
    private bridgeProvider?: BridgeProvider<WalletConsumer>;
    private sessionManager: SessionManager;
    private storageAdapter: StorageAdapter;
    private isConnected = false;
    private reconnectAttempts = 0;
    private eventCallback?: EventCallback<RawBridgeEvent>;
    private lastEventId?: string;
    private storageKey = 'bridge_last_event_id';

    constructor(config: BridgeConfig, sessionManager: SessionManager, storageAdapter: StorageAdapter) {
        this.config = {
            heartbeatInterval: 5000,
            reconnectInterval: 15000,
            maxReconnectAttempts: 5,
            ...config,
        };
        this.sessionManager = sessionManager;
        this.storageAdapter = storageAdapter;
    }

    /**
     * Set event callback for incoming bridge events
     */
    setEventCallback(callback: EventCallback<RawBridgeEvent>): void {
        this.eventCallback = callback;
    }

    /**
     * Initialize bridge connection
     */
    async initialize(): Promise<void> {
        if (this.bridgeProvider) {
            log.warn('Bridge already initialized');
            return;
        }

        try {
            await this.loadLastEventId();
            await this.connectToBridge();
        } catch (error) {
            log.error('Failed to initialize bridge', { error });
            throw error;
        }
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
        // debugger;
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
        // TODO: Remove client from bridge if possible
        // The bridge-sdk might not support removing individual clients
        log.debug('Session removed', { appSessionId });
    }

    /**
     * Send response to dApp
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async sendResponse(sessionId: string, requestId: string, response: any): Promise<void> {
        if (!this.bridgeProvider) {
            throw new Error('Bridge not initialized');
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

    /**
     * Close bridge connection
     */
    async close(): Promise<void> {
        if (this.bridgeProvider) {
            await this.bridgeProvider.close();
            this.bridgeProvider = undefined;
        }

        // this.sessions.clear();
        this.isConnected = false;
        this.reconnectAttempts = 0;
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
    private async connectToBridge(): Promise<void> {
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
                listener: this.handleBridgeEvent.bind(this),
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
                    this.connectToBridge().catch((error) => log.error('Bridge reconnection failed', { error }));
                }, this.config.reconnectInterval);
            }
            throw error;
        }
    }

    /**
     * Add client to existing bridge connection
     */
    private async updateClients(): Promise<void> {
        // TODO: The bridge-sdk might not support adding clients dynamically
        // This would require closing and reopening the bridge with updated clients
        log.debug('Updating clients');
        if (this.bridgeProvider) {
            const clients = await this.getClients();
            log.info('[BRIDGE] Restoring connection', { clients: clients.length });
            // await this.bridgeProvider.close();
            await this.bridgeProvider.restoreConnection(clients, {
                lastEventId: this.lastEventId,
            });
        }
    }

    /**
     * Handle incoming bridge events
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
                sessionId: event.sessionId,
                timestamp: Date.now(),
                from: event?.from,
            };

            if (rawEvent.from) {
                const session = await this.sessionManager.getSession(rawEvent.from);
                if (session?.wallet) {
                    rawEvent.wallet = session.wallet;
                }
            }

            // Forward to event callback
            if (this.eventCallback) {
                this.eventCallback(rawEvent);
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
