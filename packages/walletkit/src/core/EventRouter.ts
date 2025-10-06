// Event routing and handler coordination

import { WalletResponseTemplateError } from '@tonconnect/protocol';

import type {
    EventConnectRequest,
    EventTransactionRequest,
    EventSignDataRequest,
    EventDisconnect,
    TonWalletKitOptions,
} from '../types';
import type { RawBridgeEvent, EventHandler, EventCallback, EventType, BridgeEventBase } from '../types/internal';
import { ConnectHandler } from '../handlers/ConnectHandler';
import { TransactionHandler } from '../handlers/TransactionHandler';
import { SignDataHandler } from '../handlers/SignDataHandler';
import { DisconnectHandler } from '../handlers/DisconnectHandler';
import { validateBridgeEvent } from '../validation/events';
import { globalLogger } from './Logger';
import type { EventEmitter } from './EventEmitter';
import { SessionManager } from './SessionManager';
import { WalletManager } from './WalletManager';
import { EventRequestError } from '../types/events';
import { BridgeManager } from './BridgeManager';
import { AnalyticsApi } from '../analytics/sender';

const log = globalLogger.createChild('EventRouter');

export class EventRouter {
    private handlers: EventHandler[] = [];
    private bridgeManager!: BridgeManager;

    // Event callbacks
    private connectRequestCallbacks: EventCallback<EventConnectRequest>[] = [];
    private transactionRequestCallbacks: EventCallback<EventTransactionRequest>[] = [];
    private signDataRequestCallbacks: EventCallback<EventSignDataRequest>[] = [];
    private disconnectCallbacks: EventCallback<EventDisconnect>[] = [];
    private errorCallbacks: EventCallback<EventRequestError>[] = [];

    constructor(
        private eventEmitter: EventEmitter,
        private sessionManager: SessionManager,
        private walletManager: WalletManager,
        private config: TonWalletKitOptions,
        private analyticsApi?: AnalyticsApi,
    ) {
        this.config = config;
        this.setupHandlers();
    }

    setBridgeManager(bridgeManager: BridgeManager): void {
        this.bridgeManager = bridgeManager;
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
                    if ('error' in result) {
                        this.notifyErrorCallbacks({ incomingEvent: event, result: result });
                        try {
                            await this.bridgeManager.sendResponse(event, result);
                        } catch (error) {
                            log.error('Error sending response for error event', { error, event, result });
                        }
                        return;
                    }
                    await handler.notify(result as BridgeEventBase);
                    break;
                }
            }
        } catch (error) {
            log.error('Error routing event', { error });
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

    onRequestError(callback: EventCallback<EventRequestError>): void {
        this.errorCallbacks.push(callback);
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

    removeErrorCallback(callback: EventCallback<EventRequestError>): void {
        const index = this.errorCallbacks.indexOf(callback);
        if (index >= 0) {
            this.errorCallbacks.splice(index, 1);
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
        this.errorCallbacks = [];
    }

    /**
     * Setup event handlers
     */
    private setupHandlers(): void {
        this.handlers = [
            new ConnectHandler(this.notifyConnectRequestCallbacks.bind(this), this.config, this.analyticsApi),
            new TransactionHandler(
                this.notifyTransactionRequestCallbacks.bind(this),
                this.eventEmitter,
                this.config,
                this.walletManager,
                this.analyticsApi,
            ),
            new SignDataHandler(this.notifySignDataRequestCallbacks.bind(this), this.config, this.analyticsApi),
            new DisconnectHandler(this.notifyDisconnectCallbacks.bind(this), this.sessionManager),
        ];
    }

    /**
     * Notify connect request callbacks
     */
    private notifyConnectRequestCallbacks(event: EventConnectRequest | WalletResponseTemplateError): void {
        if ('error' in event) {
            return;
        }
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

    /**
     * Notify error callbacks
     */
    private notifyErrorCallbacks(event: EventRequestError): void {
        this.errorCallbacks.forEach((callback) => {
            try {
                callback(event);
            } catch (error) {
                log.error('Error in error callback', { error });
            }
        });
    }

    /**
     * Get enabled event types based on registered callbacks
     * Used by durable event processor to filter events
     * TODO - on change, trigger wallet processing restart
     */
    getEnabledEventTypes(): EventType[] {
        const enabledTypes: EventType[] = [];

        if (this.connectRequestCallbacks.length > 0) {
            enabledTypes.push('connect');
        }
        if (this.transactionRequestCallbacks.length > 0) {
            enabledTypes.push('sendTransaction');
        }
        if (this.signDataRequestCallbacks.length > 0) {
            enabledTypes.push('signData');
        }
        if (this.disconnectCallbacks.length > 0) {
            enabledTypes.push('disconnect');
        }

        return enabledTypes;
    }
}
