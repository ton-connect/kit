import { StorageAdapter } from '@ton/walletkit';

/**
 * Android native storage adapter
 * Uses Android's JavascriptInterface methods for persistent storage
 */
export class AndroidStorageAdapter implements StorageAdapter {
    private androidBridge: any;

    constructor() {
        // Prefer namespaced WalletKitNativeStorage if injected by polyfills
        const anyWin = window as any;
        if (typeof anyWin.WalletKitNativeStorage !== 'undefined') {
            this.androidBridge = anyWin.WalletKitNativeStorage;
        } else if (typeof anyWin.Android !== 'undefined') {
            // Fallback to legacy Android bridge
            this.androidBridge = anyWin.Android;
        } else {
            console.warn('[AndroidStorageAdapter] Android bridge not available, storage will not persist');
        }
    }

    async get(key: string): Promise<string | null> {
        if (!this.androidBridge || typeof this.androidBridge.storageGet !== 'function') {
            console.warn('[AndroidStorageAdapter] get() called but bridge not available:', key);
            return null;
        }

        try {
            const value = this.androidBridge.storageGet(key);
            console.log('[AndroidStorageAdapter] get:', key, '=', value ? `${value.substring(0, 100)}...` : 'null');
            return value || null;
        } catch (error) {
            console.error('[AndroidStorageAdapter] Failed to get key:', key, error);
            return null;
        }
    }

    async set(key: string, value: string): Promise<void> {
        if (!this.androidBridge || typeof this.androidBridge.storageSet !== 'function') {
            console.warn('[AndroidStorageAdapter] set() called but bridge not available:', key);
            return;
        }

        try {
            console.log('[AndroidStorageAdapter] set:', key, '=', value.substring(0, 100) + '...');
            this.androidBridge.storageSet(key, value);
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
