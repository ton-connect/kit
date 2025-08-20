// Bridge connection and communication management

import { SessionCrypto } from '@tonconnect/protocol';
import { BridgeProvider, WalletConsumer } from 'bridge-sdk';

import type { BridgeConfig, RawBridgeEvent, EventCallback } from '../types/internal';
import { logger } from './Logger';

export class BridgeManager {
    private config: BridgeConfig;
    private bridgeProvider?: BridgeProvider<WalletConsumer>;
    private sessions: Map<string, SessionCrypto> = new Map();
    private isConnected = false;
    private reconnectAttempts = 0;
    private eventCallback?: EventCallback<RawBridgeEvent>;

    constructor(config: BridgeConfig) {
        this.config = {
            heartbeatInterval: 5000,
            reconnectInterval: 15000,
            maxReconnectAttempts: 5,
            ...config,
        };
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
            logger.warn('Bridge already initialized');
            return;
        }

        try {
            await this.connectToBridge();
        } catch (error) {
            logger.error('Failed to initialize bridge', { error });
            throw error;
        }
    }

    /**
     * Create new session for a dApp connection
     */
    async createSession(appSessionId: string): Promise<SessionCrypto> {
        const walletSession = new SessionCrypto();
        this.sessions.set(appSessionId, walletSession);

        // If bridge is already connected, add this client
        if (this.bridgeProvider && this.isConnected) {
            await this.addClientToBridge(walletSession, appSessionId);
        }

        return walletSession;
    }

    /**
     * Remove session
     */
    async removeSession(appSessionId: string): Promise<void> {
        const session = this.sessions.get(appSessionId);
        if (!session) {
            return;
        }

        this.sessions.delete(appSessionId);

        // TODO: Remove client from bridge if possible
        // The bridge-sdk might not support removing individual clients
        logger.debug('Session removed', { appSessionId });
    }

    /**
     * Send response to dApp
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async sendResponse(sessionId: string, requestId: string, response: any): Promise<void> {
        if (!this.bridgeProvider) {
            throw new Error('Bridge not initialized');
        }

        // TODO: Implement response sending via bridge
        // This depends on the bridge-sdk API for sending responses
        logger.debug('Sending response', { sessionId, requestId, response });
    }

    /**
     * Close bridge connection
     */
    async close(): Promise<void> {
        if (this.bridgeProvider) {
            await this.bridgeProvider.close();
            this.bridgeProvider = undefined;
        }

        this.sessions.clear();
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
    getSessionCount(): number {
        return this.sessions.size;
    }

    /**
     * Connect to TON Connect bridge
     */
    private async connectToBridge(): Promise<void> {
        try {
            // Prepare clients array for existing sessions
            const clients = Array.from(this.sessions.entries()).map(([clientId, session]) => ({
                session,
                clientId,
            }));
            this.bridgeProvider = await BridgeProvider.open<WalletConsumer>({
                bridgeUrl: this.config.bridgeUrl,
                clients,
                listener: this.handleBridgeEvent.bind(this),
                options: {
                    heartbeatReconnectIntervalMs: this.config.reconnectInterval,
                },
            });
            this.isConnected = true;
            this.reconnectAttempts = 0;
            logger.info('Bridge connected successfully');
        } catch (error) {
            logger.error('Bridge connection failed', { error });
            // Attempt reconnection if not at max attempts
            if (this.reconnectAttempts < (this.config.maxReconnectAttempts || 5)) {
                this.reconnectAttempts++;
                logger.info('Bridge reconnection attempt', { attempt: this.reconnectAttempts });
                setTimeout(() => {
                    this.connectToBridge().catch((error) => logger.error('Bridge reconnection failed', { error }));
                }, this.config.reconnectInterval);
            }
            throw error;
        }
    }

    /**
     * Add client to existing bridge connection
     */
    private async addClientToBridge(session: SessionCrypto, clientId: string): Promise<void> {
        // TODO: The bridge-sdk might not support adding clients dynamically
        // This would require closing and reopening the bridge with updated clients
        logger.debug('Adding client to bridge', { clientId });
    }

    /**
     * Handle incoming bridge events
     */
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    private handleBridgeEvent(event: any): void {
        try {
            // Convert bridge event to our internal format
            const rawEvent: RawBridgeEvent = {
                id: event.id || crypto.randomUUID(),
                method: event.method || 'unknown',
                params: event.params || event,
                sessionId: event.sessionId,
                timestamp: Date.now(),
            };

            // Forward to event callback
            if (this.eventCallback) {
                this.eventCallback(rawEvent);
            }
        } catch (error) {
            logger.error('Error handling bridge event', { error });
        }
    }
}
