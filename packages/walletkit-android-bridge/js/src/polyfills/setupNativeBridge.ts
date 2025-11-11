/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Buffer as NodeBuffer } from 'buffer';

import { debugLog, debugWarn, logError } from '../utils/logger';

type NativeStorageBridge = {
    storageGet: (key: string) => string | null | undefined;
    storageSet: (key: string, value: string) => void;
    storageRemove: (key: string) => void;
    storageClear: () => void;
};

type GlobalWithBridge = typeof globalThis & {
    AndroidBridge?: NativeStorageBridge;
    WalletKitNative?: NativeStorageBridge;
    WalletKitNativeStorage?: Storage;
    Buffer?: typeof NodeBuffer;
};

function ensureBuffer(scope: GlobalWithBridge) {
    if (typeof scope.Buffer === 'undefined') {
        Object.defineProperty(scope, 'Buffer', {
            value: NodeBuffer,
            writable: true,
            configurable: true,
        });
        debugLog('[walletkitBridge] ✅ Buffer polyfill injected');
    }
}

/**
 * Sets up the native storage bridge that connects JavaScript to Android's secure storage.
 * Creates window.WalletKitNativeStorage that delegates to AndroidBridge or WalletKitNative.
 *
 * Note: Modern Android WebView (API 24+) already supports all standard Web APIs
 * (fetch, TextEncoder, URL, etc.), so no polyfills are needed.
 */
export function setupNativeBridge() {
    const scopes: Array<GlobalWithBridge | undefined> = [
        typeof globalThis !== 'undefined' ? (globalThis as GlobalWithBridge) : undefined,
        typeof window !== 'undefined' ? (window as GlobalWithBridge) : undefined,
        typeof self !== 'undefined' ? (self as GlobalWithBridge) : undefined,
    ];

    scopes.forEach((scope) => {
        if (!scope) return;

        ensureBuffer(scope);

        // Check if we have the native bridge available
        const bridge = scope.AndroidBridge || scope.WalletKitNative;

        if (!bridge) {
            debugWarn('[walletkitBridge] No native bridge found, WalletKitNativeStorage will not be available');
            return;
        }

        // Validate that the bridge has storage methods
        if (
            typeof bridge.storageGet !== 'function' ||
            typeof bridge.storageSet !== 'function' ||
            typeof bridge.storageRemove !== 'function' ||
            typeof bridge.storageClear !== 'function'
        ) {
            debugWarn('[walletkitBridge] Bridge is missing storage methods, WalletKitNativeStorage will not be available');
            return;
        }

        // Create a secure storage implementation that redirects to the native bridge
        try {
            const nativeStorage: Storage = {
                getItem(key: string): string | null {
                    try {
                        const value = bridge.storageGet(key);
                        return value === undefined || value === null ? null : String(value);
                    } catch (err) {
                        logError('[walletkitBridge] Error in WalletKitNativeStorage.getItem:', err);
                        return null;
                    }
                },

                setItem(key: string, value: string): void {
                    try {
                        bridge.storageSet(key, String(value));
                    } catch (err) {
                        logError('[walletkitBridge] Error in WalletKitNativeStorage.setItem:', err);
                    }
                },

                removeItem(key: string): void {
                    try {
                        bridge.storageRemove(key);
                    } catch (err) {
                        logError('[walletkitBridge] Error in WalletKitNativeStorage.removeItem:', err);
                    }
                },

                clear(): void {
                    try {
                        bridge.storageClear();
                    } catch (err) {
                        logError('[walletkitBridge] Error in WalletKitNativeStorage.clear:', err);
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

            // Expose the native storage without clobbering existing properties
            if (typeof scope.WalletKitNativeStorage === 'undefined') {
                Object.defineProperty(scope, 'WalletKitNativeStorage', {
                    value: nativeStorage,
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
    });
}

// Ensure polyfills run as soon as this module is evaluated so Buffer/native storage
// are available before any other bridge modules (especially WalletKit) execute.
setupNativeBridge();
