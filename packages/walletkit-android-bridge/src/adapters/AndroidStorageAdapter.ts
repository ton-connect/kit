/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { StorageAdapter } from '@ton/walletkit';

import { log, error } from '../utils/logger';

type AndroidStorageBridge = {
    storageGet: (key: string) => string | null;
    storageSet: (key: string, value: string) => void;
    storageRemove: (key: string) => void;
    storageClear: () => void;
};

type AndroidWindow = Window & {
    WalletKitNative?: AndroidStorageBridge;
};

/**
 * Android native storage adapter
 * Uses Android's JavascriptInterface methods for persistent storage
 */
export class AndroidStorageAdapter implements StorageAdapter {
    private androidBridge: AndroidStorageBridge;

    constructor() {
        const androidWindow = window as AndroidWindow;
        if (!androidWindow.WalletKitNative) {
            throw new Error('WalletKitNative bridge not available');
        }
        this.androidBridge = androidWindow.WalletKitNative;
    }

    async get<T>(key: string): Promise<T | null> {
        try {
            const value = this.androidBridge.storageGet(key);
            log('[AndroidStorageAdapter] get:', key, '=', value ? `${value.substring(0, 100)}...` : 'null');
            if (!value) {
                return null;
            }
            return JSON.parse(value) as T;
        } catch (err) {
            error('[AndroidStorageAdapter] Failed to get key:', key, err);
            return null;
        }
    }

    async set<T>(key: string, value: T): Promise<void> {
        try {
            const serialized = JSON.stringify(value);
            log('[AndroidStorageAdapter] set:', key, '=', serialized.substring(0, 100) + '...');
            this.androidBridge.storageSet(key, serialized);
        } catch (err) {
            error('[AndroidStorageAdapter] Failed to set key:', key, err);
        }
    }

    async remove(key: string): Promise<void> {
        try {
            log('[AndroidStorageAdapter] remove:', key);
            this.androidBridge.storageRemove(key);
        } catch (err) {
            error('[AndroidStorageAdapter] Failed to remove key:', key, err);
        }
    }

    async clear(): Promise<void> {
        try {
            log('[AndroidStorageAdapter] clear: clearing all storage');
            this.androidBridge.storageClear();
        } catch (err) {
            error('[AndroidStorageAdapter] Failed to clear storage:', err);
        }
    }
}
