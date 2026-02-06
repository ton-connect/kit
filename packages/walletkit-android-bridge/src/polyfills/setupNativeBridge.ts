/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Buffer as NodeBuffer } from 'buffer';

import { warn, error } from '../utils/logger';

type NativeStorageBridge = {
    storageGet: (key: string) => string | null | undefined;
    storageSet: (key: string, value: string) => void;
    storageRemove: (key: string) => void;
    storageClear: () => void;
    // Native EventSource methods for SSE that persists in background
    nativeEventSourceOpen?: (url: string, withCredentials: boolean) => number;
    nativeEventSourceClose?: (id: number) => void;
};

type GlobalWithBridge = typeof globalThis & {
    WalletKitNative?: NativeStorageBridge;
    WalletKitNativeStorage?: Storage;
    Buffer?: typeof NodeBuffer;
    // Global hooks for native EventSource callbacks
    __walletkitEventSourceOnOpen?: (id: number) => void;
    __walletkitEventSourceOnMessage?: (id: number, type: string, data: string, lastEventId: string | null) => void;
    __walletkitEventSourceOnError?: (id: number, message: string | null) => void;
    __walletkitEventSourceOnClose?: (id: number, reason: string | null) => void;
    // Instance tracking for EventSource connections
    __walletkitEventSources?: Map<number, NativeEventSource>;
};

function ensureBuffer(scope: GlobalWithBridge) {
    if (typeof scope.Buffer === 'undefined') {
        Object.defineProperty(scope, 'Buffer', {
            value: NodeBuffer,
            writable: true,
            configurable: true,
        });
    }
}

/**
 * Native EventSource polyfill that uses OkHttp on the Kotlin side.
 * This allows SSE connections to persist when the app goes to background,
 * unlike the WebView's built-in EventSource which pauses with JavaScript.
 */
class NativeEventSource {
    static readonly CONNECTING = 0;
    static readonly OPEN = 1;
    static readonly CLOSED = 2;

    readonly CONNECTING = 0;
    readonly OPEN = 1;
    readonly CLOSED = 2;

    readonly url: string;
    readonly withCredentials: boolean;
    readyState: number = NativeEventSource.CONNECTING;

    onopen: ((event: Event) => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onerror: ((event: Event) => void) | null = null;

    private _id: number = 0;
    private _eventListeners: Map<string, Array<(event: Event | MessageEvent) => void>> = new Map();

    constructor(url: string | URL, options?: EventSourceInit) {
        this.url = typeof url === 'string' ? url : url.toString();
        this.withCredentials = options?.withCredentials ?? false;

        const scope = window as GlobalWithBridge;
        const bridge = scope.WalletKitNative;

        if (!bridge?.nativeEventSourceOpen) {
            error('[NativeEventSource] Native bridge not available, falling back to browser EventSource');
            throw new Error('Native EventSource bridge not available');
        }

        // Register in global instance map
        if (!scope.__walletkitEventSources) {
            scope.__walletkitEventSources = new Map();
        }

        // Open connection on native side
        this._id = bridge.nativeEventSourceOpen(this.url, this.withCredentials);
        scope.__walletkitEventSources.set(this._id, this);
    }

    close(): void {
        if (this.readyState === NativeEventSource.CLOSED) {
            return;
        }

        this.readyState = NativeEventSource.CLOSED;

        const scope = window as GlobalWithBridge;
        const bridge = scope.WalletKitNative;

        if (bridge?.nativeEventSourceClose) {
            bridge.nativeEventSourceClose(this._id);
        }

        scope.__walletkitEventSources?.delete(this._id);
    }

    addEventListener(type: string, listener: (event: Event | MessageEvent) => void): void {
        if (typeof listener !== 'function') return;
        if (!this._eventListeners.has(type)) {
            this._eventListeners.set(type, []);
        }
        this._eventListeners.get(type)!.push(listener);
    }

    removeEventListener(type: string, listener: (event: Event | MessageEvent) => void): void {
        const listeners = this._eventListeners.get(type);
        if (!listeners) return;
        const index = listeners.indexOf(listener);
        if (index !== -1) {
            listeners.splice(index, 1);
        }
    }

    dispatchEvent(event: Event): boolean {
        this._dispatchEvent(event);
        return true;
    }

    // Internal dispatch method
    _dispatchEvent(event: Event | MessageEvent): void {
        const type = event.type;

        // Call specific handler
        if (type === 'open' && this.onopen) {
            this.onopen(event);
        } else if (type === 'message' && this.onmessage) {
            this.onmessage(event as MessageEvent);
        } else if (type === 'error' && this.onerror) {
            this.onerror(event);
        }

        // Call addEventListener listeners
        const listeners = this._eventListeners.get(type);
        if (listeners) {
            for (const listener of listeners) {
                try {
                    listener(event);
                } catch (err) {
                    error('[NativeEventSource] Listener error:', err);
                }
            }
        }
    }

    // Called from native when connection is opened
    _handleOpen(): void {
        this.readyState = NativeEventSource.OPEN;
        const event = new Event('open');
        this._dispatchEvent(event);
    }

    // Called from native when a message is received
    _handleMessage(data: string, eventType: string, lastEventId: string | null): void {
        const event = new MessageEvent(eventType || 'message', {
            data: data,
            lastEventId: lastEventId || '',
            origin: new URL(this.url).origin,
        });
        this._dispatchEvent(event);
    }

    // Called from native when an error occurs
    _handleError(message: string | null): void {
        this.readyState = NativeEventSource.CLOSED;
        const event = new Event('error');
        (event as Event & { message?: string }).message = message ?? undefined;
        this._dispatchEvent(event);
    }
}

/**
 * Sets up the native EventSource hooks that the Kotlin bridge calls.
 */
function setupNativeEventSource(scope: GlobalWithBridge) {
    const bridge = scope.WalletKitNative;

    // Only use native EventSource if the bridge supports it
    if (!bridge?.nativeEventSourceOpen || !bridge?.nativeEventSourceClose) {
        return;
    }

    // Initialize instance tracking
    if (!scope.__walletkitEventSources) {
        scope.__walletkitEventSources = new Map();
    }

    // Set up global callbacks that native code will call
    scope.__walletkitEventSourceOnOpen = (id: number) => {
        const instance = scope.__walletkitEventSources?.get(id);
        if (instance) {
            instance._handleOpen();
        }
    };

    scope.__walletkitEventSourceOnMessage = (
        id: number,
        eventType: string,
        data: string,
        lastEventId: string | null
    ) => {
        const instance = scope.__walletkitEventSources?.get(id);
        if (instance) {
            instance._handleMessage(data, eventType, lastEventId);
        }
    };

    scope.__walletkitEventSourceOnError = (id: number, message: string | null) => {
        const instance = scope.__walletkitEventSources?.get(id);
        if (instance) {
            instance._handleError(message);
        }
    };

    scope.__walletkitEventSourceOnClose = (id: number, _reason: string | null) => {
        const instance = scope.__walletkitEventSources?.get(id);
        if (instance && instance.readyState !== NativeEventSource.CLOSED) {
            instance.readyState = NativeEventSource.CLOSED;
            // Dispatch close as an error event (EventSource spec)
            const event = new Event('error');
            instance._dispatchEvent(event);
        }
        scope.__walletkitEventSources?.delete(id);
    };

    // Replace global EventSource with native implementation
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).EventSource = NativeEventSource;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).EventSource = NativeEventSource;

}

/**
 * Sets up the native storage bridge that connects JavaScript to Android's secure storage.
 * Creates window.WalletKitNativeStorage that delegates to WalletKitNative.
 *
 * Note: Modern Android WebView (API 24+) already supports all standard Web APIs
 * (fetch, TextEncoder, URL, etc.), so no polyfills are needed.
 */
export function setupNativeBridge() {
    const scope = window as GlobalWithBridge;

    ensureBuffer(scope);

    // Set up native EventSource for background SSE
    setupNativeEventSource(scope);

    const bridge = scope.WalletKitNative;

    if (!bridge) {
        warn('[walletkitBridge] WalletKitNative bridge not found, storage will not be available');
        return;
    }

    // Validate that the bridge has storage methods
    if (
        typeof bridge.storageGet !== 'function' ||
        typeof bridge.storageSet !== 'function' ||
        typeof bridge.storageRemove !== 'function' ||
        typeof bridge.storageClear !== 'function'
    ) {
        warn('[walletkitBridge] Bridge is missing storage methods, WalletKitNativeStorage will not be available');
        return;
    }

    // Create a secure storage implementation that redirects to the native bridge
    try {
        const nativeStorage = {
            getItem(key: string): string | null {
                try {
                    const value = bridge.storageGet(key);
                    return value === undefined || value === null ? null : String(value);
                } catch (err) {
                    error('[walletkitBridge] Error in WalletKitNativeStorage.getItem:', err);
                    return null;
                }
            },

            setItem(key: string, value: string): void {
                try {
                    bridge.storageSet(key, String(value));
                } catch (err) {
                    error('[walletkitBridge] Error in WalletKitNativeStorage.setItem:', err);
                }
            },

            removeItem(key: string): void {
                try {
                    bridge.storageRemove(key);
                } catch (err) {
                    error('[walletkitBridge] Error in WalletKitNativeStorage.removeItem:', err);
                }
            },

            clear(): void {
                try {
                    bridge.storageClear();
                } catch (err) {
                    error('[walletkitBridge] Error in WalletKitNativeStorage.clear:', err);
                }
            },
        } as Storage;

        // Expose the native storage without clobbering existing properties
        if (typeof scope.WalletKitNativeStorage === 'undefined') {
            Object.defineProperty(scope, 'WalletKitNativeStorage', {
                value: nativeStorage,
                writable: false,
                configurable: true,
            });
        } else {
            warn('[walletkitBridge] WalletKitNativeStorage already present, not overriding');
        }
    } catch (err) {
        error('[walletkitBridge] Failed to expose WalletKitNativeStorage:', err);
    }
}

// Ensure polyfills run as soon as this module is evaluated so Buffer/native storage
// are available before any other bridge modules (especially WalletKit) execute.
setupNativeBridge();
