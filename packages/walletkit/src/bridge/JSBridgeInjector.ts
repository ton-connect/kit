// JS Bridge injection code generator for TonConnect

import type { JSBridgeInjectOptions, DeviceInfo } from '../types/jsBridge';
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

/**
 * Injects TonConnect JS Bridge directly into the window object
 * Creates a bridge implementation and attaches it to the window
 *
 * @param options - Configuration options for the bridge
 * @throws Error if wallet name is invalid
 */
export function injectBridgeCode(options: JSBridgeInjectOptions): void {
    const walletName = sanitizeWalletName(options.walletName);

    // Merge device info with defaults
    const deviceInfo: DeviceInfo = {
        ...DEFAULT_DEVICE_INFO,
        appName: walletName,
        ...options.deviceInfo,
    };

    const isWalletBrowser =
        typeof globalThis !== 'undefined' &&
        typeof (globalThis as typeof globalThis & { chrome?: { runtime?: unknown } }).chrome?.runtime !== 'undefined';

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
     * TonConnect Bridge Implementation
     * Implements the TonConnect JS Bridge specification
     * @see https://github.com/ton-blockchain/ton-connect/blob/main/bridge.md#js-bridge
     */
    class TonConnectBridge {
        deviceInfo: DeviceInfo;
        walletInfo: unknown;
        protocolVersion: number;
        isWalletBrowser: boolean;
        private _eventListeners: Array<(event: unknown) => void>;
        private _messageId: number;
        private _pendingRequests: Map<number, unknown>;
        private _connected: boolean;

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
            this._connected = false;

            // Bind methods to preserve context
            this.connect = this.connect.bind(this);
            this.restoreConnection = this.restoreConnection.bind(this);
            this.send = this.send.bind(this);
            this.listen = this.listen.bind(this);
            this._handleResponse = this._handleResponse.bind(this);
            this._handleEvent = this._handleEvent.bind(this);
        }

        /**
         * Initiates connect request
         * @param protocolVersion - Protocol version to use
         * @param message - ConnectRequest message
         * @returns ConnectEvent or ConnectEventError
         */
        async connect(protocolVersion: number, message: unknown): Promise<unknown> {
            if (!protocolVersion || !message) {
                throw new Error('Invalid connect parameters');
            }

            return new Promise((resolve, reject) => {
                const messageId = ++this._messageId;

                // Store pending request with timeout
                const timeoutId = setTimeout(() => {
                    if (this._pendingRequests.has(messageId)) {
                        this._pendingRequests.delete(messageId);
                        reject(new Error('Connection request timeout'));
                    }
                }, 30000); // 30 second timeout

                this._pendingRequests.set(messageId, {
                    resolve,
                    reject,
                    type: 'connect',
                    timeoutId,
                });

                // Send request to extension/wallet
                window.postMessage(
                    {
                        type: 'TONCONNECT_BRIDGE_REQUEST',
                        source: `${walletName}-tonconnect`,
                        method: 'connect',
                        messageId: messageId,
                        params: {
                            protocolVersion: protocolVersion,
                            message: message,
                        },
                    },
                    '*',
                );
            });
        }

        /**
         * Attempts to restore previous connection
         * @returns ConnectEvent with ton_addr or ConnectEventError
         */
        async restoreConnection(): Promise<unknown> {
            return new Promise((resolve, reject) => {
                const messageId = ++this._messageId;

                const timeoutId = setTimeout(() => {
                    if (this._pendingRequests.has(messageId)) {
                        this._pendingRequests.delete(messageId);
                        // Return ConnectEventError format for unknown app
                        reject({
                            event: 'connect_error',
                            id: messageId,
                            payload: {
                                code: 100,
                                message: 'Unknown app',
                            },
                        });
                    }
                }, 10000); // 10 second timeout for restore

                this._pendingRequests.set(messageId, {
                    resolve,
                    reject,
                    type: 'restoreConnection',
                    timeoutId,
                });

                window.postMessage(
                    {
                        type: 'TONCONNECT_BRIDGE_REQUEST',
                        source: `${walletName}-tonconnect`,
                        method: 'restoreConnection',
                        messageId: messageId,
                        params: {},
                    },
                    '*',
                );
            });
        }

        /**
         * Sends a message to the bridge
         * @param message - AppRequest message
         * @returns WalletResponse
         */
        async send(message: unknown): Promise<unknown> {
            if (!message || typeof message !== 'object') {
                throw new Error('Invalid message parameter');
            }

            return new Promise((resolve, reject) => {
                const messageId = ++this._messageId;

                const timeoutId = setTimeout(() => {
                    if (this._pendingRequests.has(messageId)) {
                        this._pendingRequests.delete(messageId);
                        reject(new Error('Request timeout'));
                    }
                }, 60000); // 60 second timeout for requests

                this._pendingRequests.set(messageId, {
                    resolve,
                    reject,
                    type: 'send',
                    timeoutId,
                });

                window.postMessage(
                    {
                        type: 'TONCONNECT_BRIDGE_REQUEST',
                        source: `${walletName}-tonconnect`,
                        method: 'send',
                        messageId: messageId,
                        params: { message: message },
                    },
                    '*',
                );
            });
        }

        /**
         * Registers a listener for events from the wallet
         * @param callback - Event callback function
         * @returns Unsubscribe function
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
         * Internal method to handle responses from extension
         * @private
         */
        _handleResponse(data: Record<string, unknown>): void {
            if (!data.messageId || !this._pendingRequests.has(data.messageId as number)) {
                return;
            }

            const pendingRequest = this._pendingRequests.get(data.messageId as number);
            if (!pendingRequest) return;

            const { resolve, reject, timeoutId } = pendingRequest as {
                resolve: (value: unknown) => void;
                reject: (reason: unknown) => void;
                timeoutId: ReturnType<typeof setTimeout>;
            };
            this._pendingRequests.delete(data.messageId as number);

            // Clear timeout
            if (timeoutId) {
                clearTimeout(timeoutId);
            }

            if (data.success) {
                resolve(data.result);
            } else {
                const error = data.error;
                if (typeof error === 'object' && error && 'code' in error && 'message' in error) {
                    // Structured error
                    reject(error);
                } else {
                    // Simple error message
                    reject(new Error((error as string) || 'Unknown error'));
                }
            }
        }

        /**
         * Internal method to handle events from extension
         * @private
         */
        _handleEvent(event: unknown): void {
            // Dispatch to all listeners
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

    // Set up message listener for responses and events
    const messageListener = (event: MessageEvent) => {
        // Only handle messages from same window
        if (event.source !== window) return;

        const data = event.data;
        if (!data || typeof data !== 'object') return;

        // Handle bridge responses
        if (data.type === 'TONCONNECT_BRIDGE_RESPONSE' && data.source === `${walletName}-tonconnect`) {
            bridge._handleResponse(data);
            return;
        }

        // Handle bridge events
        if (data.type === 'TONCONNECT_BRIDGE_EVENT' && data.source === `${walletName}-tonconnect`) {
            bridge._handleEvent(data.event);
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
    console.log(`TonConnect JS Bridge injected for ${walletName}`);
}
