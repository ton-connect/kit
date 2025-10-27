/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { InjectedToExtensionBridgeRequestPayload } from '../../types/jsBridge';
import {
    INJECT_CONTENT_SCRIPT,
    TONCONNECT_BRIDGE_EVENT,
    TONCONNECT_BRIDGE_REQUEST,
    TONCONNECT_BRIDGE_RESPONSE,
} from '../utils/messageTypes';
import { DEFAULT_REQUEST_TIMEOUT, RESTORE_CONNECTION_TIMEOUT } from '../utils/timeouts';
import type { Transport } from './Transport';

interface PendingRequest {
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
    timeoutId: ReturnType<typeof setTimeout>;
}

/**
 * Chrome extension transport implementation
 * Handles communication between injected bridge and extension background script
 */
export class ExtensionTransport implements Transport {
    private extensionId: string | null = null;
    private readonly source: string;
    private readonly window: Window;
    private readonly pendingRequests = new Map<string, PendingRequest>();
    private eventCallback: ((event: unknown) => void) | null = null;
    private messageListener: ((event: MessageEvent) => void) | null = null;

    constructor(window: Window, source: string) {
        this.window = window;
        this.source = source;
        this.setupMessageListener();
    }

    /**
     * Setup listener for messages from extension
     */
    private setupMessageListener(): void {
        this.messageListener = (event: MessageEvent) => {
            if (event.source !== this.window) return;

            const data = event.data;
            if (!data || typeof data !== 'object') return;

            // Handle extension ID injection
            if (data.type === 'INJECT_EXTENSION_ID') {
                this.extensionId = data.extensionId;
                return;
            }

            // Handle bridge responses
            if (data.type === TONCONNECT_BRIDGE_RESPONSE && data.source === this.source) {
                this.handleResponse(data);
                return;
            }

            // Handle bridge events
            if (data.type === TONCONNECT_BRIDGE_EVENT && data.source === this.source) {
                this.handleEvent(data.event);
                return;
            }
        };

        this.window.addEventListener('message', this.messageListener);
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
            throw new Error('Chrome extension transport is not available');
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

            // Send message to extension
            try {
                // eslint-disable-next-line no-undef
                chrome.runtime.sendMessage(this.extensionId!, {
                    type: TONCONNECT_BRIDGE_REQUEST,
                    source: this.source,
                    payload: request,
                    messageId: messageId,
                });
            } catch (error) {
                this.pendingRequests.delete(messageId);
                clearTimeout(timeoutId);
                reject(error);
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
        return typeof chrome !== 'undefined' && this.extensionId !== null;
    }

    /**
     * Request content script injection for iframes
     */
    requestContentScriptInjection(): void {
        if (!this.isAvailable()) return;

        try {
            // eslint-disable-next-line no-undef
            chrome.runtime.sendMessage(this.extensionId!, {
                type: INJECT_CONTENT_SCRIPT,
            });
        } catch (error) {
            // eslint-disable-next-line no-console
            console.error('Failed to request content script injection:', error);
        }
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        // Clear all pending requests
        this.pendingRequests.forEach(({ timeoutId }) => clearTimeout(timeoutId));
        this.pendingRequests.clear();

        // Remove message listener
        if (this.messageListener) {
            this.window.removeEventListener('message', this.messageListener);
            this.messageListener = null;
        }

        this.eventCallback = null;
        this.extensionId = null;
    }
}
