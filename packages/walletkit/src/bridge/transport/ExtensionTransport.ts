/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { globalLogger } from '../../core/Logger';
import type { InjectedToExtensionBridgeRequestPayload } from '../../types/jsBridge';
import {
    INJECT_CONTENT_SCRIPT,
    TONCONNECT_BRIDGE_EVENT,
    TONCONNECT_BRIDGE_REQUEST,
    TONCONNECT_BRIDGE_RESPONSE,
} from '../utils/messageTypes';
import { DEFAULT_REQUEST_TIMEOUT, RESTORE_CONNECTION_TIMEOUT } from '../utils/timeouts';
import type { Transport } from './Transport';

const log = globalLogger.createChild('ExtensionTransport');

interface PendingRequest {
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
    timeoutId: ReturnType<typeof setTimeout>;
}

/**
 * Message sender interface for sending messages to background
 */
export type MessageSender = (data: unknown) => Promise<unknown>;

/**
 * Message listener interface for receiving messages from background
 */
export type MessageListener = (callback: (data: unknown) => void) => void;

/**
 * Browser extension transport implementation
 * Handles communication between injected bridge and extension background script
 */
export class ExtensionTransport implements Transport {
    private readonly pendingRequests = new Map<string, PendingRequest>();
    private messageSenders: MessageSender[];
    private messageListener: MessageListener;
    private eventCallback: ((event: unknown) => void) | null = null;

    constructor(sendMessage: MessageSender, messageListener: MessageListener) {
        this.messageSenders = [sendMessage];
        this.messageListener = messageListener;
        this.setupMessageListener();
    }

    setMessageSender(sendMessage: MessageSender): void {
        this.messageSenders.push(sendMessage);
    }

    setMessageListener(messageListener: MessageListener): void {
        this.messageListener = messageListener;
    }

    /**
     * Setup listener for messages from extension
     */
    setupMessageListener(): void {
        this.messageListener((e) => {
            if (
                typeof e !== 'object' ||
                e === null ||
                !('data' in e) ||
                typeof e.data !== 'object' ||
                e.data === null ||
                !('message' in e.data)
            ) {
                return;
            }
            const data = e.data.message;

            if (typeof data !== 'object' || data === null || !('type' in data)) {
                return;
            }

            if (data.type === TONCONNECT_BRIDGE_RESPONSE) {
                if (data && typeof data === 'object') {
                    this.handleResponse(
                        data as unknown as {
                            messageId: string;
                            success: boolean;
                            payload?: unknown;
                            error?: unknown;
                            source: string;
                        },
                    );
                }
            } else if (data.type === TONCONNECT_BRIDGE_EVENT) {
                if (data && typeof data === 'object') {
                    this.handleEvent(data as unknown as unknown);
                }
            }
        });
    }

    /**
     * Handle response from extension
     */
    private handleResponse(data: { messageId: string; success: boolean; payload?: unknown; error?: unknown }): void {
        const pendingRequest = this.pendingRequests.get(data.messageId);
        if (!pendingRequest) return;

        const { resolve, reject, timeoutId } = pendingRequest;
        this.pendingRequests.delete(data.messageId);
        clearTimeout(timeoutId);

        if (data.success) {
            resolve(data.payload);
        } else {
            reject(data.error);
        }
    }

    /**
     * Handle event from extension
     */
    private handleEvent(event: unknown): void {
        if (this.eventCallback) {
            try {
                this.eventCallback(event);
            } catch (error) {
                // eslint-disable-next-line no-console
                console.error('TonConnect event callback error:', error);
            }
        }
    }

    /**
     * Send request to extension
     */
    async send(request: Omit<InjectedToExtensionBridgeRequestPayload, 'id'>): Promise<unknown> {
        if (!this.isAvailable()) {
            throw new Error('Browser extension transport is not available');
        }

        return new Promise((resolve, reject) => {
            const messageId = crypto.randomUUID();
            const timeout =
                request.method === 'restoreConnection' ? RESTORE_CONNECTION_TIMEOUT : DEFAULT_REQUEST_TIMEOUT;

            // Set timeout for request
            const timeoutId = setTimeout(() => {
                if (this.pendingRequests.has(messageId)) {
                    this.pendingRequests.delete(messageId);
                    reject(new Error(`Request timeout: ${request.method}`));
                }
            }, timeout);

            // Store pending request
            this.pendingRequests.set(messageId, { resolve, reject, timeoutId });

            for (const sender of this.messageSenders) {
                // Send message to extension
                sender({
                    type: TONCONNECT_BRIDGE_REQUEST,
                    // source: this.source,
                    payload: request,
                    messageId: messageId,
                }).catch((error) => {
                    log.error('Failed to send message to extension:', error);
                    this.pendingRequests.delete(messageId);
                    clearTimeout(timeoutId);
                    reject(error);
                });
            }
        });
    }

    /**
     * Register event callback
     */
    onEvent(callback: (event: unknown) => void): void {
        this.eventCallback = callback;
    }

    /**
     * Check if transport is available
     */
    isAvailable(): boolean {
        return this.messageSenders !== null && this.messageListener !== null;
    }

    /**
     * Request content script injection for iframes
     */
    requestContentScriptInjection(): void {
        if (!this.isAvailable()) return;

        for (const sender of this.messageSenders) {
            sender({
                type: INJECT_CONTENT_SCRIPT,
            }).catch((error) => {
                log.error('Failed to request content script injection:', error);
            });
        }
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        // Clear all pending requests
        this.pendingRequests.forEach(({ timeoutId }) => clearTimeout(timeoutId));
        this.pendingRequests.clear();

        this.eventCallback = null;
    }
}
