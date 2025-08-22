// Event routing and handler coordination

import type { EventConnectRequest, EventTransactionRequest, EventSignDataRequest, EventDisconnect } from '../types';
import type { RawBridgeEvent, EventHandler, EventCallback } from '../types/internal';
import { ConnectHandler } from '../handlers/ConnectHandler';
import { TransactionHandler, type EmulationResultCallback } from '../handlers/TransactionHandler';
import { SignDataHandler } from '../handlers/SignDataHandler';
import { DisconnectHandler } from '../handlers/DisconnectHandler';
import { validateBridgeEvent } from '../validation/events';
import { globalLogger } from './Logger';

const log = globalLogger.createChild('EventRouter');

export class EventRouter {
    private handlers: EventHandler[] = [];
    private emulationResultCallback?: EmulationResultCallback;

    // Event callbacks
    private connectRequestCallbacks: EventCallback<EventConnectRequest>[] = [];
    private transactionRequestCallbacks: EventCallback<EventTransactionRequest>[] = [];
    private signDataRequestCallbacks: EventCallback<EventSignDataRequest>[] = [];
    private disconnectCallbacks: EventCallback<EventDisconnect>[] = [];

    constructor(emulationCallback?: EmulationResultCallback) {
        this.emulationResultCallback = emulationCallback;
        this.setupHandlers();
    }

    /**
     * Route incoming bridge event to appropriate handler
     */
    async routeEvent(event: RawBridgeEvent): Promise<void> {
        // Validate event structure
        const validation = validateBridgeEvent(event);
        if (!validation.isValid) {
            log.error('Invalid bridge event', { errors: validation.errors });
            return;
        }

        try {
            // Find appropriate handler
            for (const handler of this.handlers) {
                if (handler.canHandle(event)) {
                    const result = await handler.handle(event);
                    await handler.notify(result);
                    break;
                }
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
            new ConnectHandler(this.notifyConnectRequestCallbacks.bind(this)),
            new TransactionHandler(this.notifyTransactionRequestCallbacks.bind(this), this.emulationResultCallback),
            new SignDataHandler(this.notifySignDataRequestCallbacks.bind(this)),
            new DisconnectHandler(this.notifyDisconnectCallbacks.bind(this)),
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
