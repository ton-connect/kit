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
    private connectRequestCallback: EventCallback<EventConnectRequest> | undefined = undefined;
    private transactionRequestCallback: EventCallback<EventTransactionRequest> | undefined = undefined;
    private signDataRequestCallback: EventCallback<EventSignDataRequest> | undefined = undefined;
    private disconnectCallback: EventCallback<EventDisconnect> | undefined = undefined;
    private errorCallback: EventCallback<EventRequestError> | undefined = undefined;

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
                        this.notifyErrorCallback({ incomingEvent: event, result: result });
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
        this.connectRequestCallback = callback;
    }

    onTransactionRequest(callback: EventCallback<EventTransactionRequest>): void {
        this.transactionRequestCallback = callback;
    }

    onSignDataRequest(callback: EventCallback<EventSignDataRequest>): void {
        this.signDataRequestCallback = callback;
    }

    onDisconnect(callback: EventCallback<EventDisconnect>): void {
        this.disconnectCallback = callback;
    }

    onRequestError(callback: EventCallback<EventRequestError>): void {
        this.errorCallback = callback;
    }

    /**
     * Remove specific callback
     */
    removeConnectRequestCallback(): void {
        this.connectRequestCallback = undefined;
    }

    removeTransactionRequestCallback(): void {
        this.transactionRequestCallback = undefined;
    }

    removeSignDataRequestCallback(): void {
        this.signDataRequestCallback = undefined;
    }

    removeDisconnectCallback(): void {
        this.disconnectCallback = undefined;
    }

    removeErrorCallback(): void {
        this.errorCallback = undefined;
    }

    /**
     * Clear all callbacks
     */
    clearCallbacks(): void {
        this.connectRequestCallback = undefined;
        this.transactionRequestCallback = undefined;
        this.signDataRequestCallback = undefined;
        this.disconnectCallback = undefined;
        this.errorCallback = undefined;
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
        this.connectRequestCallback?.(event);
    }

    /**
     * Notify transaction request callbacks
     */
    private async notifyTransactionRequestCallbacks(event: EventTransactionRequest): Promise<void> {
        this.transactionRequestCallback?.(event);
    }

    /**
     * Notify sign data request callbacks
     */
    private notifySignDataRequestCallbacks(event: EventSignDataRequest): void {
        this.signDataRequestCallback?.(event);
    }

    /**
     * Notify disconnect callbacks
     */
    private notifyDisconnectCallbacks(event: EventDisconnect): void {
        this.disconnectCallback?.(event);
    }

    /**
     * Notify error callbacks
     */
    private notifyErrorCallback(event: EventRequestError): void {
        this.errorCallback?.(event);
    }

    /**
     * Get enabled event types based on registered callbacks
     */
    getEnabledEventTypes(): EventType[] {
        const enabledTypes: EventType[] = [];

        if (this.connectRequestCallback) {
            enabledTypes.push('connect');
        }
        if (this.transactionRequestCallback) {
            enabledTypes.push('sendTransaction');
        }
        if (this.signDataRequestCallback) {
            enabledTypes.push('signData');
        }
        if (this.disconnectCallback) {
            enabledTypes.push('disconnect');
        }

        return enabledTypes;
    }
}
