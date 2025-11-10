/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Buffer } from 'buffer';

import { URL, URLSearchParams } from 'whatwg-url';

import textEncoder from './textEncoder';
import { debugLog, debugWarn, logError } from '../utils/logger';

type NativeStorageBridge = {
    storageGet: (key: string) => string | null | undefined;
    storageSet: (key: string, value: string) => void;
    storageRemove: (key: string) => void;
    storageClear: () => void;
};

type PolyfilledGlobal = typeof globalThis & {
    fetch?: typeof fetch;
    AbortController?: typeof AbortController;
    Buffer?: typeof Buffer;
    URL?: typeof URL;
    URLSearchParams?: typeof URLSearchParams;
    AndroidBridge?: NativeStorageBridge;
    WalletKitNative?: NativeStorageBridge;
    WalletKitNativeStorage?: Storage;
};

function applyTextEncoder(target: PolyfilledGlobal) {
    try {
        textEncoder(target);
    } catch (err) {
        logError('[walletkitBridge] Failed to apply TextEncoder polyfill', err);
    }
}

function ensureFetch(target: PolyfilledGlobal) {
    if (typeof target.fetch === 'undefined' && typeof window !== 'undefined' && typeof window.fetch === 'function') {
        target.fetch = window.fetch.bind(window);
    }
}

function ensureAbortController(target: PolyfilledGlobal) {
    if (typeof target.AbortController === 'undefined') {
        type MutableAbortSignal = AbortSignal & {
            aborted: boolean;
            onabort: null;
            reason?: unknown;
            throwIfAborted(): void;
        };

        class PolyfillAbortController implements AbortController {
            signal: MutableAbortSignal = {
                aborted: false,
                addEventListener() {},
                removeEventListener() {},
                dispatchEvent() {
                    return true;
                },
                onabort: null,
                reason: undefined,
                throwIfAborted() {},
            };

            abort() {
                this.signal.aborted = true;
            }
        }
        target.AbortController = PolyfillAbortController as typeof AbortController;
    }
}

function overrideLocalStorage(target: PolyfilledGlobal) {
    // Check if we have the native bridge available
    const bridge = target.AndroidBridge || target.WalletKitNative;

    if (!bridge) {
        debugWarn('[walletkitBridge] No native bridge found, localStorage will not be overridden');
        return;
    }

    // Validate that the bridge has storage methods
    if (
        typeof bridge.storageGet !== 'function' ||
        typeof bridge.storageSet !== 'function' ||
        typeof bridge.storageRemove !== 'function' ||
        typeof bridge.storageClear !== 'function'
    ) {
        debugWarn('[walletkitBridge] Bridge is missing storage methods, localStorage will not be overridden');
        return;
    }

    // Create a secure storage implementation that redirects to the native bridge
    const _secureStorage: Storage = {
        getItem(key: string): string | null {
            try {
                const value = bridge.storageGet(key);
                return value === undefined || value === null ? null : String(value);
            } catch (err) {
                logError('[walletkitBridge] Error in localStorage.getItem:', err);
                return null;
            }
        },

        setItem(key: string, value: string): void {
            try {
                bridge.storageSet(key, String(value));
            } catch (err) {
                logError('[walletkitBridge] Error in localStorage.setItem:', err);
            }
        },

        removeItem(key: string): void {
            try {
                bridge.storageRemove(key);
            } catch (err) {
                logError('[walletkitBridge] Error in localStorage.removeItem:', err);
            }
        },

        clear(): void {
            try {
                bridge.storageClear();
            } catch (err) {
                logError('[walletkitBridge] Error in localStorage.clear:', err);
            }
        },

        get length(): number {
            // Note: The native bridge doesn't provide a length method
            // This is a limitation but shouldn't affect most use cases
            return 0;
        },

        key(_index: number): string | null {
            // Note: The native bridge doesn't provide a key enumeration method
            // This is a limitation but shouldn't affect most use cases
            return null;
        },
    };

    // Do NOT override the global localStorage (other libraries expect it).
    // Instead expose a namespaced storage object `WalletKitNativeStorage` which
    // delegates to the native bridge. Consumers of the SDK should use the
    // WalletKit storage adapter (or call window.WalletKitNativeStorage) when
    // they require secure/native persistence.
    try {
        const namespaced: Storage = {
            getItem(key: string) {
                try {
                    const value = bridge.storageGet(key);
                    return value === undefined || value === null ? null : String(value);
                } catch (err) {
                    logError('[walletkitBridge] Error in WalletKitNativeStorage.getItem:', err);
                    return null;
                }
            },
            setItem(key: string, value: string) {
                try {
                    bridge.storageSet(key, String(value));
                } catch (err) {
                    logError('[walletkitBridge] Error in WalletKitNativeStorage.setItem:', err);
                }
            },
            removeItem(key: string) {
                try {
                    bridge.storageRemove(key);
                } catch (err) {
                    logError('[walletkitBridge] Error in WalletKitNativeStorage.removeItem:', err);
                }
            },
            clear() {
                try {
                    bridge.storageClear();
                } catch (err) {
                    logError('[walletkitBridge] Error in WalletKitNativeStorage.clear:', err);
                }
            },
            get length(): number {
                return 0;
            },
            key() {
                return null;
            },
        };

        // Attach without clobbering existing properties
        if (typeof target.WalletKitNativeStorage === 'undefined') {
            Object.defineProperty(target, 'WalletKitNativeStorage', {
                value: namespaced,
                writable: false,
                configurable: true,
            });
            debugLog('[walletkitBridge] ✅ WalletKitNativeStorage exposed for secure native storage');
        } else {
            debugWarn('[walletkitBridge] WalletKitNativeStorage already present, not overriding');
        }
    } catch (err) {
        logError('[walletkitBridge] Failed to expose WalletKitNativeStorage:', err);
    }
}

export function setupPolyfills() {
    const scopes: Array<PolyfilledGlobal | undefined> = [
        typeof globalThis !== 'undefined' ? (globalThis as PolyfilledGlobal) : undefined,
        typeof window !== 'undefined' ? (window as PolyfilledGlobal) : undefined,
        typeof self !== 'undefined' ? (self as PolyfilledGlobal) : undefined,
    ];

    scopes.forEach((scope) => {
        if (!scope) return;
        applyTextEncoder(scope);
        ensureFetch(scope);
        ensureAbortController(scope);
        overrideLocalStorage(scope);
        if (typeof scope.Buffer === 'undefined') {
            scope.Buffer = Buffer;
        }
        if (typeof scope.URL === 'undefined') {
            scope.URL = URL;
        }
        if (typeof scope.URLSearchParams === 'undefined') {
            scope.URLSearchParams = URLSearchParams;
        }
    });
}
