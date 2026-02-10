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
};

type GlobalWithBridge = typeof globalThis & {
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
    }
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
