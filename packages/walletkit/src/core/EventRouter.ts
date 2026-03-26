/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Event routing and handler coordination

import type { RawBridgeEvent, EventHandler, EventCallback, EventType } from '../types/internal';
import { ConnectHandler } from '../handlers/ConnectHandler';
import { TransactionHandler } from '../handlers/TransactionHandler';
import { SignDataHandler } from '../handlers/SignDataHandler';
import { DisconnectHandler } from '../handlers/DisconnectHandler';
import { validateBridgeEvent } from '../validation/events';
import { globalLogger } from './Logger';
import type { EventEmitter } from './EventEmitter';
import type { TONConnectSessionManager } from '../api/interfaces/TONConnectSessionManager';
import type { WalletManager } from './WalletManager';
import type { BridgeManager } from './BridgeManager';
import type { AnalyticsManager } from '../analytics';
import type {
    SendTransactionRequestEvent,
    BridgeEvent,
    RequestErrorEvent,
    DisconnectionEvent,
    SignDataRequestEvent,
    ConnectionRequestEvent,
} from '../api/models';
import type { TonWalletKitOptions } from '../types/config';
import type { TonConnectEventsHandler } from './TonConnectEventsHandler';
import type { TonConnectEventsRouter } from './TonConnectEventsRouter';

const log = globalLogger.createChild('EventRouter');

export class EventRouter implements TonConnectEventsRouter {
    private handlers: EventHandler[] = [];
    private bridgeManager!: BridgeManager;
    private eventsHandlers: Set<TonConnectEventsHandler> = new Set();

    // Event callbacks
    private connectRequestCallback: EventCallback<ConnectionRequestEvent> | undefined = undefined;
    private transactionRequestCallback: EventCallback<SendTransactionRequestEvent> | undefined = undefined;
    private signDataRequestCallback: EventCallback<SignDataRequestEvent> | undefined = undefined;
    private disconnectCallback: EventCallback<DisconnectionEvent> | undefined = undefined;
    private errorCallback: EventCallback<RequestErrorEvent> | undefined = undefined;

    constructor(
        private config: TonWalletKitOptions,
        private eventEmitter: EventEmitter,
        private sessionManager: TONConnectSessionManager,
        private walletManager: WalletManager,
        private analyticsManager?: AnalyticsManager,
    ) {
        this.setupHandlers();
    }

    setBridgeManager(bridgeManager: BridgeManager): void {
        this.bridgeManager = bridgeManager;
    }

    // TonConnectEventsRouter

    add(eventsHandler: TonConnectEventsHandler): void {
        this.eventsHandlers.add(eventsHandler);
    }

    remove(eventsHandler: TonConnectEventsHandler): void {
        this.eventsHandlers.delete(eventsHandler);
    }

    /**
     * Route incoming bridge event to appropriate handler
     */
    async routeEvent(event: RawBridgeEvent, eventsHandler?: TonConnectEventsHandler): Promise<void> {
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
                        const errorEvent = { id: result.id, data: { ...event }, error: result.error };
                        if (eventsHandler) {
                            eventsHandler.handleRequestError(errorEvent);
                        } else {
                            this.notifyErrorCallback(errorEvent);
                        }
                        try {
                            await this.bridgeManager.sendResponse(event, result);
                        } catch (error) {
                            log.error('Error sending response for error event', { error, event, result });
                        }
                        return;
                    }
                    if (eventsHandler) {
                        this.dispatchToEventsHandler(eventsHandler, event.method, result as BridgeEvent);
                    } else {
                        await handler.notify(result as BridgeEvent);
                    }
                    break;
                }
            }
        } catch (error) {
            log.error('Error routing event', { error });
            throw error;
        }
    }

    private dispatchToEventsHandler(eventsHandler: TonConnectEventsHandler, method: string, event: BridgeEvent): void {
        switch (method) {
            case 'connect':
                eventsHandler.handleConnectRequest(event as ConnectionRequestEvent);
                break;
            case 'sendTransaction':
                eventsHandler.handleSendTransactionRequest(event as SendTransactionRequestEvent);
                break;
            case 'signData':
                eventsHandler.handleSignDataRequest(event as SignDataRequestEvent);
                break;
            case 'disconnect':
                eventsHandler.handleDisconnection(event as DisconnectionEvent);
                break;
        }
    }

    /**
     * Register event callbacks
     */
    onConnectRequest(callback: EventCallback<ConnectionRequestEvent>): void {
        this.connectRequestCallback = callback;
    }

    onTransactionRequest(callback: EventCallback<SendTransactionRequestEvent>): void {
        this.transactionRequestCallback = callback;
    }

    onSignDataRequest(callback: EventCallback<SignDataRequestEvent>): void {
        this.signDataRequestCallback = callback;
    }

    onDisconnect(callback: EventCallback<DisconnectionEvent>): void {
        this.disconnectCallback = callback;
    }

    onRequestError(callback: EventCallback<RequestErrorEvent>): void {
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
            new ConnectHandler(this.notifyConnectRequestCallbacks.bind(this), this.config, this.analyticsManager),
            new TransactionHandler(
                this.notifyTransactionRequestCallbacks.bind(this),
                this.config,
                this.eventEmitter,
                this.walletManager,
                this.sessionManager,
                this.analyticsManager,
            ),
            new SignDataHandler(
                this.notifySignDataRequestCallbacks.bind(this),
                this.walletManager,
                this.sessionManager,
                this.analyticsManager,
            ),
            new DisconnectHandler(this.notifyDisconnectCallbacks.bind(this), this.sessionManager),
        ];
    }

    /**
     * Notify connect request callbacks
     */
    private async notifyConnectRequestCallbacks(event: ConnectionRequestEvent): Promise<void> {
        return await this.handleConnectRequest(event);
    }

    /**
     * Notify transaction request callbacks
     */
    private async notifyTransactionRequestCallbacks(event: SendTransactionRequestEvent): Promise<void> {
        return await this.handleSendTransactionRequest(event);
    }

    /**
     * Notify sign data request callbacks
     */
    private async notifySignDataRequestCallbacks(event: SignDataRequestEvent): Promise<void> {
        return await this.handleSignDataRequest(event);
    }

    /**
     * Notify disconnect callbacks
     */
    private async notifyDisconnectCallbacks(event: DisconnectionEvent): Promise<void> {
        return await this.handleDisconnection(event);
    }

    /**
     * Notify error callbacks
     */
    private async notifyErrorCallback(event: RequestErrorEvent): Promise<void> {
        return await this.handleRequestError(event);
    }

    /**
     * Get enabled event types based on registered callbacks
     */
    getEnabledEventTypes(): EventType[] {
        if (this.eventsHandlers.size > 0) {
            return ['connect', 'sendTransaction', 'signData', 'disconnect'];
        }

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

    handleConnectRequest(event: ConnectionRequestEvent): void | Promise<void> {
        this.connectRequestCallback?.(event);
        for (const handler of this.eventsHandlers) {
            handler.handleConnectRequest(event);
        }
    }

    handleSendTransactionRequest(event: SendTransactionRequestEvent): void | Promise<void> {
        this.transactionRequestCallback?.(event);
        for (const handler of this.eventsHandlers) {
            handler.handleSendTransactionRequest(event);
        }
    }

    handleSignDataRequest(event: SignDataRequestEvent): void | Promise<void> {
        this.signDataRequestCallback?.(event);
        for (const handler of this.eventsHandlers) {
            handler.handleSignDataRequest(event);
        }
    }

    handleDisconnection(event: DisconnectionEvent): void | Promise<void> {
        this.disconnectCallback?.(event);
        for (const handler of this.eventsHandlers) {
            handler.handleDisconnection(event);
        }
    }

    handleRequestError(event: RequestErrorEvent): void | Promise<void> {
        this.errorCallback?.(event);
        for (const handler of this.eventsHandlers) {
            handler.handleRequestError(event);
        }
    }
}
