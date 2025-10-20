import { StorageAdapter } from '@ton/walletkit';

/**
 * Android native storage adapter
 * Uses Android's JavascriptInterface methods for persistent storage
 */
export class AndroidStorageAdapter implements StorageAdapter {
    private androidBridge: any;

    constructor() {
        // Check if we're running in Android WebView with storage interface
        if (typeof (window as any).Android !== 'undefined') {
            this.androidBridge = (window as any).Android;
        } else {
            console.warn('[AndroidStorageAdapter] Android bridge not available, storage will not persist');
        }
    }

    async get<T>(key: string): Promise<T | null> {
        if (!this.androidBridge || typeof this.androidBridge.storageGet !== 'function') {
            console.warn('[AndroidStorageAdapter] get() called but bridge not available:', key);
            return null;
        }

        try {
            const value = this.androidBridge.storageGet(key);
            console.log('[AndroidStorageAdapter] get:', key, '=', value ? `${value.substring(0, 100)}...` : 'null');
            if (!value) {
                return null;
            }
            return JSON.parse(value) as T;
        } catch (error) {
            console.error('[AndroidStorageAdapter] Failed to get key:', key, error);
            return null;
        }
    }

    async set<T>(key: string, value: T): Promise<void> {
        if (!this.androidBridge || typeof this.androidBridge.storageSet !== 'function') {
            console.warn('[AndroidStorageAdapter] set() called but bridge not available:', key);
            return;
        }

        try {
            const serialized = JSON.stringify(value);
            console.log('[AndroidStorageAdapter] set:', key, '=', serialized.substring(0, 100) + '...');
            this.androidBridge.storageSet(key, serialized);
        } catch (error) {
            console.error('[AndroidStorageAdapter] Failed to set key:', key, error);
        }
    }

    async remove(key: string): Promise<void> {
        if (!this.androidBridge || typeof this.androidBridge.storageRemove !== 'function') {
            return;
        }

        try {
            this.androidBridge.storageRemove(key);
        } catch (error) {
            console.error('[AndroidStorageAdapter] Failed to remove key:', key, error);
        }
    }

    async clear(): Promise<void> {
        if (!this.androidBridge || typeof this.androidBridge.storageClear !== 'function') {
            return;
        }

        try {
            this.androidBridge.storageClear();
        } catch (error) {
            console.error('[AndroidStorageAdapter] Failed to clear storage:', error);
        }
    }
}
