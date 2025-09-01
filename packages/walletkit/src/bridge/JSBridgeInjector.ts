// Simplified JS Bridge injection code for TonConnect
// All logic is handled by the parent extension through WalletKit

import type { ConnectRequest } from '@tonconnect/protocol';

import type { JSBridgeInjectOptions, DeviceInfo, BridgeRequestPayload } from '../types/jsBridge';
import { sanitizeWalletName } from '../utils/walletNameValidation';

/**
 * Default device info for JS Bridge
 */
const DEFAULT_DEVICE_INFO: DeviceInfo = {
    platform: 'web',
    appName: 'Wallet',
    appVersion: '1.0.0',
    maxProtocolVersion: 2,
    features: [
        {
            name: 'SendTransaction',
            maxMessages: 4,
        },
        {
            name: 'SignData',
            types: ['text', 'binary', 'cell'],
        },
    ],
};

let extensionId: string | undefined = undefined;

/**
 * Injects a simplified TonConnect JS Bridge that forwards all requests to the parent extension
 * The extension handles all logic through WalletKit
 *
 * @param options - Configuration options for the bridge
 * @throws Error if wallet name is invalid
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function injectBridgeCode(window: any, options: JSBridgeInjectOptions): void {
    const walletName = sanitizeWalletName(options.walletName);

    // Merge device info with defaults
    const deviceInfo: DeviceInfo = {
        ...DEFAULT_DEVICE_INFO,
        appName: walletName,
        ...options.deviceInfo,
    };

    const isWalletBrowser = false;
    // typeof globalThis !== 'undefined' &&
    // typeof (globalThis as typeof globalThis & { chrome?: { runtime?: unknown } }).chrome?.runtime !== 'undefined';

    // Check if wallet already exists and has tonconnect
    if (
        (window as unknown as Record<string, unknown>)[walletName] &&
        (window as unknown as Record<string, Record<string, unknown>>)[walletName].tonconnect
    ) {
        // eslint-disable-next-line no-console
        console.log(`${walletName}.tonconnect already exists, skipping injection`);
        return;
    }

    /**
     * Simplified TonConnect Bridge Implementation
     * Forwards all requests to the parent extension where WalletKit handles the logic
     */
    class TonConnectBridge {
        deviceInfo: DeviceInfo;
        walletInfo: unknown;
        protocolVersion: number;
        isWalletBrowser: boolean;
        private _eventListeners: Array<(event: unknown) => void>;
        private _messageId: number;
        private _pendingRequests: Map<
            string,
            {
                resolve: (value: unknown) => void;
                reject: (reason: unknown) => void;
                timeoutId: ReturnType<typeof setTimeout>;
            }
        >;

        constructor() {
            // Bridge properties as per TonConnect spec
            this.deviceInfo = deviceInfo;
            this.walletInfo = options.walletInfo;
            this.protocolVersion = 2;
            this.isWalletBrowser = isWalletBrowser;

            // Internal state
            this._eventListeners = [];
            this._messageId = 0;
            this._pendingRequests = new Map();

            // Bind methods to preserve context
            this.connect = this.connect.bind(this);
            this.restoreConnection = this.restoreConnection.bind(this);
            this.send = this.send.bind(this);
            this.listen = this.listen.bind(this);
        }

        /**
         * Initiates connect request - forwards to extension
         */
        async connect(protocolVersion: number, message: ConnectRequest): Promise<unknown> {
            if (protocolVersion < 2) {
                throw new Error('Unsupported protocol version');
            }
            return this._sendToExtension({
                method: 'connect',
                params: { protocolVersion, ...message },
            });
        }

        /**
         * Attempts to restore previous connection - forwards to extension
         */
        async restoreConnection(): Promise<unknown> {
            return this._sendToExtension({
                method: 'restoreConnection',
                params: [],
            });
        }

        /**
         * Sends a message to the bridge - forwards to extension
         */
        async send(message: unknown): Promise<unknown> {
            return this._sendToExtension({
                method: 'send',
                params: [message],
            });
        }

        /**
         * Registers a listener for events from the wallet
         */
        listen(callback: (event: unknown) => void): () => void {
            if (typeof callback !== 'function') {
                throw new Error('Callback must be a function');
            }

            this._eventListeners.push(callback);

            // Return unsubscribe function
            return () => {
                const index = this._eventListeners.indexOf(callback);
                if (index > -1) {
                    this._eventListeners.splice(index, 1);
                }
            };
        }

        /**
         * Sends request to extension and returns promise
         * @private
         */
        private async _sendToExtension(data: Omit<BridgeRequestPayload, 'id'>): Promise<unknown> {
            return new Promise((resolve, reject) => {
                const messageId = (++this._messageId).toString();

                // Set timeout for request
                const timeoutId = setTimeout(
                    () => {
                        if (this._pendingRequests.has(messageId)) {
                            this._pendingRequests.delete(messageId);
                            reject(new Error(`${messageId} request timeout`));
                        }
                    },
                    data.method === 'restoreConnection' ? 10000 : 30000,
                );

                // Store pending request
                this._pendingRequests.set(messageId, { resolve, reject, timeoutId });

                if (typeof chrome === 'undefined' || !extensionId) {
                    return;
                }
                // eslint-disable-next-line no-undef
                chrome.runtime.sendMessage(extensionId, {
                    type: 'TONCONNECT_BRIDGE_REQUEST',
                    source: `${walletName}-tonconnect`,
                    payload: {
                        ...data,
                        id: messageId,
                    },
                });

                // Send to extension via postMessage
                // window.postMessage(
                //     {
                //         type: 'TONCONNECT_BRIDGE_REQUEST',
                //         source: `${walletName}-tonconnect`,
                //         payload: {
                //             ...data,
                //             id: messageId,
                //         },
                //     },
                //     '*',
                // );
            });
        }

        /**
         * Handles responses from extension
         * @private
         */
        _handleResponse(data: { messageId: number; success: boolean; payload?: unknown; error?: unknown }): void {
            const pendingRequest = this._pendingRequests.get(data.messageId.toString());
            if (!pendingRequest) return;

            const { resolve, reject, timeoutId } = pendingRequest;
            this._pendingRequests.delete(data.messageId.toString());
            clearTimeout(timeoutId);

            if (data.success) {
                resolve(data.payload);
            } else {
                reject(data.error);
            }
        }

        /**
         * Handles events from extension
         * @private
         */
        _handleEvent(event: unknown): void {
            this._eventListeners.forEach((callback) => {
                try {
                    callback(event);
                } catch (error) {
                    // eslint-disable-next-line no-console
                    console.error('TonConnect event listener error:', error);
                }
            });
        }
    }

    // Create bridge instance
    const bridge = new TonConnectBridge();

    // Set up message listener for responses and events from extension
    const messageListener = (event: MessageEvent) => {
        if (event.source !== window) return;

        const data = event.data;
        if (!data || typeof data !== 'object') return;

        // Handle bridge responses from extension
        if (data.type === 'TONCONNECT_BRIDGE_RESPONSE' && data.source === `${walletName}-tonconnect`) {
            bridge._handleResponse(data);
            return;
        }

        // Handle bridge events from extension
        if (data.type === 'TONCONNECT_BRIDGE_EVENT' && data.source === `${walletName}-tonconnect`) {
            bridge._handleEvent(data.event);
            return;
        }

        if (data.type === 'INJECT_EXTENSION_ID') {
            extensionId = data.extensionId;
            return;
        }
    };

    window.addEventListener('message', messageListener);

    // Ensure wallet object exists
    if (!(window as unknown as Record<string, unknown>)[walletName]) {
        (window as unknown as Record<string, Record<string, unknown>>)[walletName] = {};
    }

    // Inject the bridge
    Object.defineProperty((window as unknown as Record<string, Record<string, unknown>>)[walletName], 'tonconnect', {
        value: bridge,
        writable: false,
        enumerable: true,
        configurable: false,
    });

    // Dispatch ready event
    try {
        window.dispatchEvent(
            new CustomEvent(`${walletName}Ready`, {
                detail: { bridge: bridge },
                bubbles: false,
                cancelable: false,
            }),
        );
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Failed to dispatch ${walletName}Ready event:`, error);
    }

    // eslint-disable-next-line no-console
    console.log(`TonConnect JS Bridge injected for ${walletName} - forwarding to extension`, window);

    const injectContentScript = () => {
        if (typeof chrome === 'undefined') {
            return;
        }
        // eslint-disable-next-line no-undef
        chrome.runtime.sendMessage(extensionId, {
            type: 'INJECT_CONTENT_SCRIPT',
        });
    };

    // Listen for DOM changes and log when iframe is created
    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            if (mutation.type !== 'childList') {
                return;
            }
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType !== Node.ELEMENT_NODE) {
                    return;
                }
                const element = node as Element;

                // Check if any child elements are iframes
                const iframes = element.querySelectorAll('iframe');
                for (const _ of iframes) {
                    injectContentScript();
                }

                if (element.tagName !== 'IFRAME') {
                    return;
                }

                if (typeof chrome === 'undefined') {
                    return;
                }
                injectContentScript();

                element.removeEventListener('load', injectContentScript);
                element.removeEventListener('error', injectContentScript);
                element.addEventListener('load', injectContentScript);
                element.addEventListener('error', injectContentScript);
            });
        });
    });

    // Start observing the document with the configured parameters
    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });
}
