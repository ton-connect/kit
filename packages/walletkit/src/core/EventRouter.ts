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

const log = globalLogger.createChild('EventRouter');

export class EventRouter {
    private handlers: EventHandler[] = [];
    private bridgeManager!: BridgeManager;

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
                        this.notifyErrorCallback({ id: result.id, data: { ...event }, error: result.error });
                        try {
                            await this.bridgeManager.sendResponse(event, result);
                        } catch (error) {
                            log.error('Error sending response for error event', { error, event, result });
                        }
                        return;
                    }
                    await handler.notify(result as BridgeEvent);
                    break;
                }
            }
        } catch (error) {
            log.error('Error routing event', { error });
            throw error;
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
        return await this.connectRequestCallback?.(event);
    }

    /**
     * Notify transaction request callbacks
     */
    private async notifyTransactionRequestCallbacks(event: SendTransactionRequestEvent): Promise<void> {
        return await this.transactionRequestCallback?.(event);
    }

    /**
     * Notify sign data request callbacks
     */
    private async notifySignDataRequestCallbacks(event: SignDataRequestEvent): Promise<void> {
        return await this.signDataRequestCallback?.(event);
    }

    /**
     * Notify disconnect callbacks
     */
    private async notifyDisconnectCallbacks(event: DisconnectionEvent): Promise<void> {
        return await this.disconnectCallback?.(event);
    }

    /**
     * Notify error callbacks
     */
    private async notifyErrorCallback(event: RequestErrorEvent): Promise<void> {
        return await this.errorCallback?.(event);
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
