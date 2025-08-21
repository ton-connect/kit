// Event routing and handler coordination

import type {
    WalletInterface,
    EventConnectRequest,
    EventTransactionRequest,
    EventSignDataRequest,
    EventDisconnect,
} from '../types';
import type {
    RawBridgeEvent,
    RequestContext,
    EventHandler,
    EventCallback,
    RawBridgeEventConnect,
    RawBridgeEventTransaction,
} from '../types/internal';
import { ConnectHandler } from '../handlers/ConnectHandler';
import { TransactionHandler } from '../handlers/TransactionHandler';
import { SignDataHandler } from '../handlers/SignDataHandler';
import { DisconnectHandler } from '../handlers/DisconnectHandler';
import { validateBridgeEvent } from '../validation/events';
import { globalLogger } from './Logger';

const log = globalLogger.createChild('EventRouter');

export class EventRouter {
    private handlers: EventHandler[] = [];

    // Event callbacks
    private connectRequestCallbacks: EventCallback<EventConnectRequest>[] = [];
    private transactionRequestCallbacks: EventCallback<EventTransactionRequest>[] = [];
    private signDataRequestCallbacks: EventCallback<EventSignDataRequest>[] = [];
    private disconnectCallbacks: EventCallback<EventDisconnect>[] = [];

    constructor() {
        this.setupHandlers();
    }

    /**
     * Route incoming bridge event to appropriate handler
     */
    async routeEvent(event: RawBridgeEvent, sessionId?: string): Promise<void> {
        // Validate event structure
        const validation = validateBridgeEvent(event);
        if (!validation.isValid) {
            log.error('Invalid bridge event', { errors: validation.errors });
            return;
        }

        // Create request context
        const context: RequestContext = {
            id: event.id,
            sessionId,
            timestamp: new Date(),
        };

        try {
            // Find appropriate handler
            const handler = this.handlers.find((h) => h.canHandle(event));

            if (!handler) {
                log.warn('No handler found for event', { method: event.method });
                return;
            }

            // Handle the event based on its type
            if (handler instanceof ConnectHandler) {
                const connectEvent = await handler.handle(event as RawBridgeEventConnect, context);
                this.notifyConnectRequestCallbacks(connectEvent);
            } else if (handler instanceof TransactionHandler) {
                const txEvent = await handler.handle(event as RawBridgeEventTransaction, context);
                this.notifyTransactionRequestCallbacks(txEvent);
            } else if (handler instanceof SignDataHandler) {
                const signEvent = await handler.handle(event, context);
                this.notifySignDataRequestCallbacks(signEvent);
            } else if (handler instanceof DisconnectHandler) {
                const disconnectEvent = await handler.handle(event, context);
                this.notifyDisconnectCallbacks(disconnectEvent);
            }
        } catch (error) {
            log.error('Error routing event', { error });
            // TODO: Could emit error event or call error callback
        }
    }

    /**
     * Register event callbacks
     */
    onConnectRequest(callback: EventCallback<EventConnectRequest>): void {
        this.connectRequestCallbacks.push(callback);
    }

    onTransactionRequest(callback: EventCallback<EventTransactionRequest>): void {
        this.transactionRequestCallbacks.push(callback);
    }

    onSignDataRequest(callback: EventCallback<EventSignDataRequest>): void {
        this.signDataRequestCallbacks.push(callback);
    }

    onDisconnect(callback: EventCallback<EventDisconnect>): void {
        this.disconnectCallbacks.push(callback);
    }

    /**
     * Remove specific callback
     */
    removeConnectRequestCallback(callback: EventCallback<EventConnectRequest>): void {
        const index = this.connectRequestCallbacks.indexOf(callback);
        if (index >= 0) {
            this.connectRequestCallbacks.splice(index, 1);
        }
    }

    removeTransactionRequestCallback(callback: EventCallback<EventTransactionRequest>): void {
        const index = this.transactionRequestCallbacks.indexOf(callback);
        if (index >= 0) {
            this.transactionRequestCallbacks.splice(index, 1);
        }
    }

    removeSignDataRequestCallback(callback: EventCallback<EventSignDataRequest>): void {
        const index = this.signDataRequestCallbacks.indexOf(callback);
        if (index >= 0) {
            this.signDataRequestCallbacks.splice(index, 1);
        }
    }

    removeDisconnectCallback(callback: EventCallback<EventDisconnect>): void {
        const index = this.disconnectCallbacks.indexOf(callback);
        if (index >= 0) {
            this.disconnectCallbacks.splice(index, 1);
        }
    }

    /**
     * Clear all callbacks
     */
    clearCallbacks(): void {
        this.connectRequestCallbacks = [];
        this.transactionRequestCallbacks = [];
        this.signDataRequestCallbacks = [];
        this.disconnectCallbacks = [];
    }

    /**
     * Setup event handlers
     */
    private setupHandlers(): void {
        this.handlers = [
            new ConnectHandler(),
            new TransactionHandler(),
            new SignDataHandler(),
            new DisconnectHandler(),
        ];
    }

    /**
     * Notify connect request callbacks
     */
    private notifyConnectRequestCallbacks(event: EventConnectRequest): void {
        this.connectRequestCallbacks.forEach((callback) => {
            try {
                callback(event);
            } catch (error) {
                log.error('Error in connect request callback', { error });
            }
        });
    }

    /**
     * Notify transaction request callbacks
     */
    private notifyTransactionRequestCallbacks(event: EventTransactionRequest): void {
        this.transactionRequestCallbacks.forEach((callback) => {
            try {
                callback(event);
            } catch (error) {
                log.error('Error in transaction request callback', { error });
            }
        });
    }

    /**
     * Notify sign data request callbacks
     */
    private notifySignDataRequestCallbacks(event: EventSignDataRequest): void {
        this.signDataRequestCallbacks.forEach((callback) => {
            try {
                callback(event);
            } catch (error) {
                log.error('Error in sign data request callback', { error });
            }
        });
    }

    /**
     * Notify disconnect callbacks
     */
    private notifyDisconnectCallbacks(event: EventDisconnect): void {
        this.disconnectCallbacks.forEach((callback) => {
            try {
                callback(event);
            } catch (error) {
                log.error('Error in disconnect callback', { error });
            }
        });
    }
}
