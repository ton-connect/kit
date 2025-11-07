/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable no-undef */
// Bridge injection for Android internal browser
import { Buffer } from 'buffer';

window.Buffer = Buffer;
if (globalThis && !globalThis.Buffer) {
    globalThis.Buffer = Buffer;
}

// Debug logging flag - can be set via window.__TONCONNECT_DEBUG__ from native code
// In production builds, this should be false to suppress all bridge logs
const DEBUG_ENABLED = typeof (window as any).__TONCONNECT_DEBUG__ !== 'undefined' 
    ? (window as any).__TONCONNECT_DEBUG__ 
    : false; // Default to false (no logs) in production

// Debug logger - only logs when DEBUG_ENABLED is true
const debugLog = (...args: any[]) => {
    if (DEBUG_ENABLED) {
        console.log(...args);
    }
};

import { injectBridgeCode } from '@ton/walletkit/bridge';
import type { InjectedToExtensionBridgeRequestPayload } from '@ton/walletkit';

// Import Transport type - it's available as internal export
interface Transport {
    send(request: Omit<InjectedToExtensionBridgeRequestPayload, 'id'>): Promise<unknown>;
    onEvent(callback: (event: unknown) => void): void;
    isAvailable(): boolean;
    requestContentScriptInjection(): void;
    destroy(): void;
}

// Polyfill Buffer
if (typeof window !== 'undefined') {
    (window as any).Buffer = Buffer;
}
if (typeof globalThis !== 'undefined' && !globalThis.Buffer) {
    (globalThis as any).Buffer = Buffer;
}

// Generate unique frame ID (preserve existing one if already set to prevent re-injection issues)
const frameId =
    (window as any).__tonconnect_frameId ||
    (window === window.top ? 'main' : `frame-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);

// Store the frameId (only set if not already set)
if (!(window as any).__tonconnect_frameId) {
    (window as any).__tonconnect_frameId = frameId;
}

const isAndroidWebView = typeof (window as any).AndroidTonConnect !== 'undefined';

debugLog(`[TonConnect] ===== INJECTION STARTING =====`);
debugLog(`[TonConnect] Frame ID: ${frameId}`);
debugLog(`[TonConnect] Is top window: ${window === window.top}`);
debugLog(`[TonConnect] Is iframe: ${window !== window.parent}`);
debugLog(`[TonConnect] Android WebView: ${isAndroidWebView}`);
debugLog(`[TonConnect] Current URL: ${window.location.href}`);
debugLog(`[TonConnect] ===== STARTING BRIDGE SETUP =====`);

// Device info matching demo wallet extension format
const deviceInfo = {
    platform: 'android' as const,
    appName: 'Tonkeeper',
    appVersion: '1.0.0',
    maxProtocolVersion: 2,
    features: [
        'SendTransaction',
        {
            name: 'SendTransaction',
            maxMessages: 4,
        },
        {
            name: 'SignData',
            types: ['text', 'binary', 'cell'],
        },
    ] as any,
};

// Wallet info matching demo wallet extension format
// NOTE: TonConnect SDK expects snake_case properties (app_name, about_url, image)
// even though the TypeScript types use camelCase
const walletInfo = {
    name: 'tonkeeper', // key for wallet
    app_name: 'Tonkeeper', // SDK expects app_name not appName
    about_url: 'https://tonkeeper.com', // SDK expects about_url not aboutUrl
    image: 'https://tonkeeper.com/assets/tonconnect-icon.png', // SDK expects image not imageUrl
    platforms: [
        'ios' as const,
        'android' as const,
        'macos' as const,
        'windows' as const,
        'linux' as const,
        'chrome' as const,
        'firefox' as const,
        'safari' as const,
    ], // supported platforms
    jsBridgeKey: 'tonkeeper', // window key for wallet bridge
    injected: true, // wallet is injected into the page (via injectBridgeCode)
    embedded: true, // dApp IS embedded in wallet (wallet's internal browser) - tells dApp to prefer injected bridge
    tondns: 'tonkeeper.ton', // tondns for wallet
    bridgeUrl: 'https://bridge.tonapi.io/bridge', // url for wallet bridge
    features: [
        'SendTransaction',
        {
            name: 'SendTransaction',
            maxMessages: 4,
        },
        {
            name: 'SignData',
            types: ['text', 'binary', 'cell'],
        },
    ] as any,
} as any; // Cast to any to bypass TypeScript type checking

/**
 * Android WebView Transport Implementation
 * Uses BridgeInterface as message bus with postMessage for iframe communication
 */
class AndroidWebViewTransport implements Transport {
    private pendingRequests = new Map<
        string,
        { resolve: (value: unknown) => void; reject: (error: Error) => void; timeout: NodeJS.Timeout }
    >();
    private eventCallbacks: Array<(event: unknown) => void> = [];

    constructor() {
        // Set up notification handlers and postMessage relay
        this.setupNotificationHandlers();
        this.setupPostMessageRelay();
    }

    private setupNotificationHandlers(): void {
        const bridge = (window as any).AndroidTonConnect;
        if (!bridge) {
            console.warn('[AndroidTransport] ⚠️ AndroidTonConnect bridge not available');
            return;
        }

        debugLog('[AndroidTransport] 🔧 Setting up notification handlers in frame:', frameId);
        debugLog('[AndroidTransport] 🔧 Is top window:', window === window.top);
        debugLog('[AndroidTransport] 🔧 Window location:', window.location.href);

        // Main frame: Pull from BridgeInterface and broadcast to iframes
        if (window === window.top) {
            bridge.__notifyResponse = (messageId: string) => {
                debugLog(`[AndroidTransport] 📬 Main frame notified of response: ${messageId}`);
                this.handleResponseNotification(messageId);
            };

            bridge.__notifyEvent = () => {
                debugLog('[AndroidTransport] � Main frame notified of event');
                this.handleEventNotification();
            };
        }

        debugLog('[AndroidTransport] ✅ Notification handlers registered');
    }

    private setupPostMessageRelay(): void {
        // Listen for messages from parent frames and relay to children (recursive cascade)
        window.addEventListener('message', (event) => {
            // Prevent infinite loops - don't process messages from self
            if (event.source === window) {
                debugLog(`[AndroidTransport] 🔄 Frame ${frameId} ignoring self-message`);
                return;
            }

            debugLog(
                `[AndroidTransport] 📬 Frame ${frameId} received postMessage:`,
                event.data?.type,
                'from origin:',
                event.origin,
            );

            // Handle response notifications
            if (event.data?.type === 'ANDROID_BRIDGE_RESPONSE') {
                const messageId = event.data.messageId;
                debugLog(`[AndroidTransport] 📨 Frame ${frameId} received response notification: ${messageId}`);

                // 1. Try to handle in THIS frame (if we have pending request)
                this.pullAndDeliverResponse(messageId);

                // 2. Relay to ALL child iframes (recursive cascade to reach nested iframes)
                const childIframes = document.querySelectorAll('iframe');
                if (childIframes.length > 0) {
                    debugLog(
                        `[AndroidTransport] 🔁 Frame ${frameId} relaying response to ${childIframes.length} child iframe(s)`,
                    );
                    childIframes.forEach((iframe, index) => {
                        try {
                            iframe.contentWindow?.postMessage(event.data, '*');
                            debugLog(`[AndroidTransport] ✅ Frame ${frameId} relayed to child iframe #${index}`);
                        } catch (e) {
                            console.warn(
                                `[AndroidTransport] ❌ Frame ${frameId} failed to relay to child iframe #${index}:`,
                                e,
                            );
                        }
                    });
                } else {
                    debugLog(`[AndroidTransport] 📭 Frame ${frameId} has no child iframes to relay to`);
                }
            }
            // Handle event notifications
            else if (event.data?.type === 'ANDROID_BRIDGE_EVENT') {
                debugLog(`[AndroidTransport] 📨 Frame ${frameId} received event notification`);

                // 1. Try to handle in THIS frame
                this.pullAndDeliverEvent();

                // 2. Relay to ALL child iframes (recursive cascade)
                const childIframes = document.querySelectorAll('iframe');
                if (childIframes.length > 0) {
                    debugLog(
                        `[AndroidTransport] 🔁 Frame ${frameId} relaying event to ${childIframes.length} child iframe(s)`,
                    );
                    childIframes.forEach((iframe, index) => {
                        try {
                            iframe.contentWindow?.postMessage(event.data, '*');
                            debugLog(
                                `[AndroidTransport] ✅ Frame ${frameId} relayed event to child iframe #${index}`,
                            );
                        } catch (e) {
                            console.warn(
                                `[AndroidTransport] ❌ Frame ${frameId} failed to relay event to child iframe #${index}:`,
                                e,
                            );
                        }
                    });
                } else {
                    debugLog(`[AndroidTransport] 📭 Frame ${frameId} has no child iframes to relay to`);
                }
            }
        });

        debugLog(`[AndroidTransport] ✅ postMessage listener with recursive relay registered in frame: ${frameId}`);
    }

    private handleResponseNotification(messageId: string): void {
        // Main frame: Pull response and deliver locally, then trigger recursive cascade
        debugLog(`[AndroidTransport] 📡 Main frame initiating response notification cascade for: ${messageId}`);

        // 1. Try to handle in main frame first
        this.pullAndDeliverResponse(messageId);

        // 2. Broadcast to direct child iframes (they will relay to their children recursively)
        const iframes = document.querySelectorAll('iframe');
        debugLog(`[AndroidTransport] 📡 Main frame broadcasting to ${iframes.length} direct child iframe(s)`);

        iframes.forEach((iframe, index) => {
            try {
                iframe.contentWindow?.postMessage(
                    {
                        type: 'ANDROID_BRIDGE_RESPONSE',
                        messageId,
                    },
                    '*',
                );
                debugLog(`[AndroidTransport] ✅ Main frame sent to direct child iframe #${index}`);
            } catch (e) {
                console.warn(`[AndroidTransport] ❌ Main frame failed to notify iframe #${index}:`, e);
            }
        });
    }

    private handleEventNotification(): void {
        // Main frame: Pull event and deliver locally, then trigger recursive cascade
        debugLog('[AndroidTransport] 📡 Main frame initiating event notification cascade');

        // 1. Try to handle in main frame first
        this.pullAndDeliverEvent();

        // 2. Broadcast to direct child iframes (they will relay to their children recursively)
        const iframes = document.querySelectorAll('iframe');
        debugLog(`[AndroidTransport] 📡 Main frame broadcasting to ${iframes.length} direct child iframe(s)`);

        iframes.forEach((iframe, index) => {
            try {
                iframe.contentWindow?.postMessage(
                    {
                        type: 'ANDROID_BRIDGE_EVENT',
                    },
                    '*',
                );
                debugLog(`[AndroidTransport] ✅ Main frame sent event to direct child iframe #${index}`);
            } catch (e) {
                console.warn(`[AndroidTransport] ❌ Main frame failed to notify iframe #${index}:`, e);
            }
        });
    }

    private pullAndDeliverResponse(messageId: string): void {
        const pending = this.pendingRequests.get(messageId);
        if (!pending) {
            debugLog(`[AndroidTransport] No pending request for: ${messageId} in frame: ${frameId}`);
            return;
        }

        try {
            const bridge = (window as any).AndroidTonConnect;
            if (!bridge?.pullResponse) {
                console.error(`[AndroidTransport] Bridge not available in frame: ${frameId}`);
                return;
            }

            const responseStr = bridge.pullResponse(messageId);
            if (responseStr) {
                const response = JSON.parse(responseStr);
                debugLog(
                    `[AndroidTransport] ✅ Pulled and processing response for: ${messageId} in frame: ${frameId}`,
                );

                clearTimeout(pending.timeout);
                this.pendingRequests.delete(messageId);

                if (response.error) {
                    pending.reject(new Error(response.error.message || 'Failed'));
                } else {
                    pending.resolve(response.payload);
                }
            } else {
                console.warn(
                    `[AndroidTransport] Response ${messageId} already pulled or not available in frame: ${frameId}`,
                );
            }
        } catch (error) {
            console.error('[AndroidTransport] Failed to pull/process response:', error);
            pending.reject(error as Error);
        }
    }

    private pullAndDeliverEvent(): void {
        try {
            const bridge = (window as any).AndroidTonConnect;
            if (!bridge?.pullEvent || !bridge?.hasEvent) return;

            // Pull event for this frame (Kotlin tracks per-frame consumption)
            while (bridge.hasEvent(frameId)) {
                const eventStr = bridge.pullEvent(frameId);
                if (eventStr) {
                    const data = JSON.parse(eventStr) as {
                        type?: string;
                        event?: unknown;
                    };

                    debugLog('[AndroidTransport] 🔔 Pulled event in frame:', frameId);
                    debugLog('[AndroidTransport] 🔔 Event data:', JSON.stringify(data).substring(0, 200));

                    if (data.type === 'TONCONNECT_BRIDGE_EVENT' && data.event) {
                        debugLog('[AndroidTransport] 🔔 Event callbacks count:', this.eventCallbacks.length);

                        this.eventCallbacks.forEach((callback, index) => {
                            try {
                                debugLog(`[AndroidTransport] 🔔 Calling event callback #${index}`);
                                callback(data.event);
                                debugLog(`[AndroidTransport] ✅ Event callback #${index} completed`);
                            } catch (error) {
                                console.error(`[AndroidTransport] ❌ Event callback #${index} error:`, error);
                            }
                        });
                    }
                }
            }
        } catch (error) {
            console.error('[AndroidTransport] Failed to pull/process event:', error);
        }
    }

    async send(request: Omit<InjectedToExtensionBridgeRequestPayload, 'id'>): Promise<unknown> {
        debugLog('[AndroidTransport] 📤 Sending request:', request.method);
        debugLog('[AndroidTransport] 📤 Frame ID:', frameId);
        debugLog('[AndroidTransport] 📤 Is top window:', window === window.top);

        const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
        const method = request.method || 'unknown';
        const params = request.params || {};

        const payload = {
            type: 'TONCONNECT_BRIDGE_REQUEST',
            messageId,
            method,
            params,
            frameId,
        };

        debugLog('[AndroidTransport] 📤 Sending to Kotlin with messageId:', messageId);
        (window as any).AndroidTonConnect.postMessage(JSON.stringify(payload));

        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                console.error(`[AndroidTransport] ⏱️ Timeout waiting for response to ${messageId}`);
                this.pendingRequests.delete(messageId);
                reject(new Error('Request timeout'));
            }, 30000);

            debugLog('[AndroidTransport] ⏳ Waiting for response to messageId:', messageId);
            this.pendingRequests.set(messageId, { resolve, reject, timeout });
        });
    }

    onEvent(callback: (event: unknown) => void): void {
        debugLog('[AndroidTransport] 📝 Registering event callback');
        debugLog('[AndroidTransport] 📝 Frame ID:', frameId);
        debugLog('[AndroidTransport] 📝 Window location:', window.location.href);
        debugLog('[AndroidTransport] 📝 Is top window:', window === window.top);
        debugLog('[AndroidTransport] 📝 Callbacks before:', this.eventCallbacks.length);

        this.eventCallbacks.push(callback);
        debugLog('[AndroidTransport] 📝 Callbacks after:', this.eventCallbacks.length);
    }

    isAvailable(): boolean {
        return isAndroidWebView;
    }

    requestContentScriptInjection(): void {
        debugLog('[TonConnect] ⚠️ requestContentScriptInjection CALLED - IframeWatcher detected iframe!');

        // For Android WebView, we need to inject the bridge into iframes
        if (typeof document !== 'undefined') {
            const iframes = document.querySelectorAll('iframe');
            debugLog(`[TonConnect] Found ${iframes.length} iframes in DOM`);

            iframes.forEach((iframe, index) => {
                debugLog(
                    `[TonConnect] Processing iframe ${index}:`,
                    iframe.src || iframe.getAttribute('src') || '(no src)',
                );

                try {
                    // Try to access iframe's window (will fail for cross-origin)
                    const iframeWindow = iframe.contentWindow;

                    if (!iframeWindow) {
                        debugLog(`[TonConnect] iframe ${index}: contentWindow is null`);
                        return;
                    }

                    if (iframeWindow === window) {
                        debugLog(`[TonConnect] iframe ${index}: contentWindow === window (skipping self)`);
                        return;
                    }

                    // Check if bridge already exists in this iframe
                    const hasExtension = !!(iframeWindow as any).tonkeeper?.tonconnect;
                    debugLog(`[TonConnect] iframe ${index}: Bridge exists? ${hasExtension}`);

                    if (!hasExtension) {
                        debugLog(`[TonConnect] ✅ Injecting bridge into same-origin iframe ${index}`);
                        // Re-run injection in the iframe context
                        injectBridgeCode(
                            iframeWindow,
                            {
                                deviceInfo,
                                walletInfo,
                                isWalletBrowser: true,
                            },
                            new AndroidWebViewTransport(),
                        );
                        debugLog(`[TonConnect] ✅ Bridge injection complete for iframe ${index}`);
                    }
                } catch (e) {
                    // Cross-origin iframe, can't access
                    debugLog(
                        `[TonConnect] iframe ${index}: Cross-origin - will use postMessage bridge (${(e as Error).message})`,
                    );
                }
            });
        } else {
            debugLog('[TonConnect] document is undefined, cannot query iframes');
        }
    }

    destroy(): void {
        this.pendingRequests.forEach(({ timeout, reject }) => {
            clearTimeout(timeout);
            reject(new Error('Transport destroyed'));
        });
        this.pendingRequests.clear();
        this.eventCallbacks = [];

        // Clean up notification handlers
        const bridge = (window as any).AndroidTonConnect;
        if (bridge && window === window.top) {
            delete bridge.__notifyResponse;
            delete bridge.__notifyEvent;
        }
    }
}

/**
 * Iframe Bridge Support - NOT NEEDED FOR ANDROID WEBVIEW
 *
 * Android WebView automatically injects JavaScript into ALL frames (main + iframes)
 * This is different from browser extensions which need postMessage bridges for cross-origin iframes.
 *
 * Each iframe gets its own direct injection of window.tonkeeper.tonconnect via injectBridgeCode(),
 * so there's no need for a postMessage relay between parent and iframe.
 *
 * See BridgeInjector.kt:
 * - Uses webView.evaluateJavascript() which runs in all frames
 * - Android WebView documentation: "JavaScript runs in the context of the current page,
 *   including all iframes within that page"
 */
debugLog('[TonConnect] Android WebView injects bridge into all frames automatically');

// Create custom transport for Android or undefined for default behavior
const transport: Transport | undefined = isAndroidWebView ? new AndroidWebViewTransport() : undefined;

// Function to inject the bridge
const performInjection = () => {
    debugLog('[TonConnect] Injecting bridge code...');
    debugLog('[TonConnect] document.body exists?', !!document.body);
    debugLog('[TonConnect] Current iframes in DOM:', document.querySelectorAll('iframe').length);

    // Inject wallet with proper configuration and custom transport
    injectBridgeCode(
        window,
        {
            deviceInfo,
            walletInfo,
            isWalletBrowser: true, // CRITICAL: tells SDK this is wallet's internal browser
        },
        transport,
    );

    debugLog(`[TonConnect] Bridge ready for frame: ${frameId} (transport: ${transport ? 'Android' : 'default'})`);
    debugLog('[TonConnect] Wallet Info:', JSON.stringify(walletInfo, null, 2));
    debugLog('[TonConnect] isWalletBrowser check:', (window as any).tonkeeper?.tonconnect?.isWalletBrowser);

    // After injection, manually check for existing iframes
    setTimeout(() => {
        const iframes = document.querySelectorAll('iframe');
        debugLog(`[TonConnect] Post-injection check: ${iframes.length} iframes found`);
        if (iframes.length > 0) {
            debugLog('[TonConnect] ⚠️ Iframes exist but IframeWatcher may not have triggered yet');
            debugLog('[TonConnect] Manually triggering iframe injection...');
            if (transport && 'requestContentScriptInjection' in transport) {
                (transport as any).requestContentScriptInjection();
            }
        }
    }, 100);
};

// Wait for document.body to exist before injecting
// This is critical because IframeWatcher needs document.body to observe for iframes
if (!document.body) {
    debugLog('[TonConnect] Waiting for document.body before injecting bridge...');

    // Use DOMContentLoaded if DOM is still loading
    if (document.readyState === 'loading') {
        document.addEventListener(
            'DOMContentLoaded',
            () => {
                debugLog('[TonConnect] DOMContentLoaded fired, injecting bridge');
                performInjection();
            },
            { once: true },
        );
    } else {
        // DOM is interactive/complete but body doesn't exist yet (rare) - use timer
        const checkBody = () => {
            if (document.body) {
                debugLog('[TonConnect] document.body now available, injecting bridge');
                performInjection();
            } else {
                setTimeout(checkBody, 10);
            }
        };
        checkBody();
    }
} else {
    // Body already exists, inject immediately
    debugLog('[TonConnect] document.body exists, injecting bridge immediately');
    performInjection();
}
