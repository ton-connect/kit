/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

// Bridge injection for Android internal browser
import { injectBridgeCode, TONCONNECT_BRIDGE_EVENT, TONCONNECT_BRIDGE_REQUEST } from '@ton/walletkit/bridge';
import type { BridgeEvent, InjectedToExtensionBridgeRequestPayload, JSBridgeInjectOptions } from '@ton/walletkit';
import type { Transport } from '@ton/walletkit';

import { error } from './utils/logger';

declare global {
    interface Window {
        injectWalletKit: (options: JSBridgeInjectOptions) => void;
        AndroidTonConnect?: TonConnectBridge;
    }
}

type TonConnectBridge = {
    __notifyResponse?: (messageId: string) => void;
    __notifyEvent?: () => void;
    pullResponse?: (messageId: string) => string | null;
    pullEvent?: (frameId: string) => string | null;
    hasEvent?: (frameId: string) => boolean;
    postMessage?: (payload: string) => void;
};

type TonConnectWindow = Window & {
    __tonconnect_frameId?: string;
    tonkeeper?: {
        tonconnect?: {
            isWalletBrowser?: boolean;
        };
    };
};

const tonWindow = window as TonConnectWindow;

// Generate unique frame ID
const frameId =
    tonWindow.__tonconnect_frameId ||
    (tonWindow.__tonconnect_frameId =
        window === window.top ? 'main' : `frame-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`);

const isAndroidWebView = typeof tonWindow.AndroidTonConnect !== 'undefined';

/**
 * Android WebView Transport Implementation
 * Uses BridgeInterface as message bus with postMessage for iframe communication
 */
class AndroidWebViewTransport implements Transport {
    private pendingRequests = new Map<
        string,
        {
            resolve: (value: BridgeEvent) => void;
            reject: (error: Error) => void;
            timeout: ReturnType<typeof setTimeout>;
        }
    >();
    private eventCallbacks: Array<(event: BridgeEvent) => void> = [];

    constructor() {
        // Set up notification handlers and postMessage relay
        this.setupNotificationHandlers();
        this.setupPostMessageRelay();
    }

    private setupNotificationHandlers(): void {
        const bridge = tonWindow.AndroidTonConnect;
        if (!bridge) return;

        // Main frame: Pull from BridgeInterface and broadcast to iframes
        if (window === window.top) {
            bridge.__notifyResponse = (messageId: string) => {
                this.handleResponseNotification(messageId);
            };

            bridge.__notifyEvent = () => {
                this.handleEventNotification();
            };
        }
    }

    private setupPostMessageRelay(): void {
        window.addEventListener('message', (event) => {
            if (event.source === window) return;

            if (event.data?.type === 'ANDROID_BRIDGE_RESPONSE') {
                this.pullAndDeliverResponse(event.data.messageId);
                document.querySelectorAll('iframe').forEach((iframe) => {
                    try {
                        iframe.contentWindow?.postMessage(event.data, '*');
                    } catch (_e) {
                        // Ignore cross-origin errors
                    }
                });
            } else if (event.data?.type === 'ANDROID_BRIDGE_EVENT') {
                this.pullAndDeliverEvent();
                document.querySelectorAll('iframe').forEach((iframe) => {
                    try {
                        iframe.contentWindow?.postMessage(event.data, '*');
                    } catch (_e) {
                        // Ignore cross-origin errors
                    }
                });
            }
        });
    }

    private handleResponseNotification(messageId: string): void {
        this.pullAndDeliverResponse(messageId);
        document.querySelectorAll('iframe').forEach((iframe) => {
            try {
                iframe.contentWindow?.postMessage({ type: 'ANDROID_BRIDGE_RESPONSE', messageId }, '*');
            } catch (_e) {
                // Ignore cross-origin errors
            }
        });
    }

    private handleEventNotification(): void {
        this.pullAndDeliverEvent();
        document.querySelectorAll('iframe').forEach((iframe) => {
            try {
                iframe.contentWindow?.postMessage({ type: 'ANDROID_BRIDGE_EVENT' }, '*');
            } catch (_e) {
                // Ignore cross-origin errors
            }
        });
    }

    private pullAndDeliverResponse(messageId: string): void {
        const pending = this.pendingRequests.get(messageId);
        if (!pending) return;

        try {
            const bridge = tonWindow.AndroidTonConnect;
            if (!bridge?.pullResponse) return;

            const responseStr = bridge.pullResponse(messageId);
            if (responseStr) {
                const response = JSON.parse(responseStr);
                clearTimeout(pending.timeout);
                this.pendingRequests.delete(messageId);

                if (response.error) {
                    pending.reject(new Error(response.error.message || 'Failed'));
                } else {
                    pending.resolve(response.payload);
                }
            }
        } catch (err) {
            error('[AndroidTransport] Failed to pull/process response:', err);
            pending.reject(err as Error);
        }
    }

    private pullAndDeliverEvent(): void {
        try {
            const bridge = tonWindow.AndroidTonConnect;
            if (!bridge?.pullEvent || !bridge?.hasEvent) return;

            while (bridge.hasEvent(frameId)) {
                const eventStr = bridge.pullEvent(frameId);
                if (eventStr) {
                    const data = JSON.parse(eventStr) as { type?: string; event?: BridgeEvent };
                    if (data.type === TONCONNECT_BRIDGE_EVENT && data.event) {
                        const event = data.event;
                        this.eventCallbacks.forEach((callback) => {
                            try {
                                callback(event);
                            } catch (err) {
                                error('[AndroidTransport] Event callback error:', err);
                            }
                        });
                    }
                }
            }
        } catch (err) {
            error('[AndroidTransport] Failed to pull/process event:', err);
        }
    }

    async send(request: Omit<InjectedToExtensionBridgeRequestPayload, 'id'>): Promise<BridgeEvent> {
        const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const bridge = tonWindow.AndroidTonConnect;
        if (!bridge?.postMessage) {
            throw new Error('AndroidTonConnect postMessage is not available');
        }

        bridge.postMessage(
            JSON.stringify({
                type: TONCONNECT_BRIDGE_REQUEST,
                messageId,
                method: request.method || 'unknown',
                params: request.params || {},
                frameId,
            }),
        );

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                this.pendingRequests.delete(messageId);
                reject(new Error('Request timeout'));
            }, 30000);

            this.pendingRequests.set(messageId, { resolve, reject, timeout });
        });
    }

    onEvent(callback: (event: BridgeEvent) => void): void {
        this.eventCallbacks.push(callback);
    }

    isAvailable(): boolean {
        return isAndroidWebView;
    }

    requestContentScriptInjection(): void {
        const iframes = document.querySelectorAll('iframe');
        iframes.forEach((iframe) => {
            try {
                const iframeWindowRaw = iframe.contentWindow;
                if (!iframeWindowRaw) {
                    return;
                }

                if (iframeWindowRaw === window) {
                    return;
                }

                // Check if bridge already exists in this iframe
                const iframeWindow = iframeWindowRaw as TonConnectWindow;
                const hasExtension = !!iframeWindow.tonkeeper?.tonconnect;

                if (!hasExtension) {
                    // Re-inject with the same options that were passed to the parent window
                    const mainWindow = window as TonConnectWindow & { __walletKitOptions?: JSBridgeInjectOptions };
                    if (iframeWindow.injectWalletKit && mainWindow.__walletKitOptions) {
                        iframeWindow.injectWalletKit(mainWindow.__walletKitOptions);
                    }
                }
            } catch (_e) {
                // Cross-origin iframe - will use postMessage bridge
            }
        });
    }

    destroy(): void {
        this.pendingRequests.forEach(({ timeout, reject }) => {
            clearTimeout(timeout);
            reject(new Error('Transport destroyed'));
        });
        this.pendingRequests.clear();
        this.eventCallbacks = [];

        const bridge = tonWindow.AndroidTonConnect;
        if (bridge) {
            delete bridge.__notifyResponse;
            delete bridge.__notifyEvent;
        }
    }
}

/**
 * Injection function called by Android with config from WalletKit
 * Matches iOS pattern: window.injectWalletKit(options)
 */
window.injectWalletKit = (options: JSBridgeInjectOptions) => {
    try {
        // Store options for iframe injection
        (window as TonConnectWindow & { __walletKitOptions?: JSBridgeInjectOptions }).__walletKitOptions = options;

        // Create custom transport for Android or undefined for default behavior
        const transport: Transport | undefined = isAndroidWebView ? new AndroidWebViewTransport() : undefined;

        // Inject wallet with configuration from Android SDK
        injectBridgeCode(window, options, transport);
    } catch (_error) {
        // Silent fail - errors logged internally
    }
};
