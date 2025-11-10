/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { StorageAdapter } from '@ton/walletkit';

import { debugLog, debugWarn, logError } from '../utils/logger';

type BridgeFunction = (...args: unknown[]) => unknown;

type AndroidStorageBridge = Record<string, BridgeFunction | undefined>;

type AndroidWindow = Window & {
    WalletKitNativeStorage?: AndroidStorageBridge;
};

/**
 * Android native storage adapter
 * Uses Android's JavascriptInterface methods for persistent storage
 */
export class AndroidStorageAdapter implements StorageAdapter {
    private androidBridge?: AndroidStorageBridge;

    constructor() {
        // Prefer namespaced WalletKitNativeStorage if injected by polyfills
        const androidWindow = window as AndroidWindow;
        if (typeof androidWindow.WalletKitNativeStorage !== 'undefined') {
            this.androidBridge = androidWindow.WalletKitNativeStorage;
        } else {
            debugWarn('[AndroidStorageAdapter] Android bridge not available, storage will not persist');
        }
    }

    async get<T>(key: string): Promise<T | null> {
        const getFn = this.getBridgeFunction<(key: string) => string | null>('storageGet', 'getItem');
        if (!getFn) {
            debugWarn('[AndroidStorageAdapter] get() called but bridge not available:', key);
            return null;
        }

        try {
            const value = getFn(key);
            debugLog('[AndroidStorageAdapter] get:', key, '=', value ? `${value.substring(0, 100)}...` : 'null');
            if (!value) {
                return null;
            }
            return JSON.parse(value) as T;
        } catch (error) {
            logError('[AndroidStorageAdapter] Failed to get key:', key, error);
            return null;
        }
    }

    async set<T>(key: string, value: T): Promise<void> {
        const setFn = this.getBridgeFunction<(key: string, serialized: string) => void>('storageSet', 'setItem');
        if (!setFn) {
            debugWarn('[AndroidStorageAdapter] set() called but bridge not available:', key);
            return;
        }

        try {
            const serialized = JSON.stringify(value);
            debugLog('[AndroidStorageAdapter] set:', key, '=', serialized.substring(0, 100) + '...');
            setFn(key, serialized);
        } catch (error) {
            logError('[AndroidStorageAdapter] Failed to set key:', key, error);
        }
    }

    async remove(key: string): Promise<void> {
        const removeFn = this.getBridgeFunction<(key: string) => void>('storageRemove', 'removeItem');
        if (!removeFn) {
            return;
        }

        try {
            removeFn(key);
        } catch (error) {
            logError('[AndroidStorageAdapter] Failed to remove key:', key, error);
        }
    }

    async clear(): Promise<void> {
        const clearFn = this.getBridgeFunction<() => void>('storageClear', 'clear');
        if (!clearFn) {
            return;
        }

        try {
            clearFn();
        } catch (error) {
            logError('[AndroidStorageAdapter] Failed to clear storage:', error);
        }
    }

    private getBridgeFunction<T extends BridgeFunction>(...candidates: string[]): T | null {
        if (!this.androidBridge) {
            return null;
        }

        for (const name of candidates) {
            const candidate = this.androidBridge[name];
            if (typeof candidate === 'function') {
                return candidate.bind(this.androidBridge) as T;
            }
        }

        return null;
    }
}
