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

    async get<T>(key: string): Promise<T | null> {
        const getFn = this.getBridgeFunction('storageGet', 'getItem');
        if (!getFn) {
            console.warn('[AndroidStorageAdapter] get() called but bridge not available:', key);
            return null;
        }

        try {
            const value = getFn(key);
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
        const setFn = this.getBridgeFunction('storageSet', 'setItem');
        if (!setFn) {
            console.warn('[AndroidStorageAdapter] set() called but bridge not available:', key);
            return;
        }

        try {
            const serialized = JSON.stringify(value);
            console.log('[AndroidStorageAdapter] set:', key, '=', serialized.substring(0, 100) + '...');
            setFn(key, serialized);
        } catch (error) {
            console.error('[AndroidStorageAdapter] Failed to set key:', key, error);
        }
    }

    async remove(key: string): Promise<void> {
        const removeFn = this.getBridgeFunction('storageRemove', 'removeItem');
        if (!removeFn) {
            return;
        }

        try {
            removeFn(key);
        } catch (error) {
            console.error('[AndroidStorageAdapter] Failed to remove key:', key, error);
        }
    }

    async clear(): Promise<void> {
        const clearFn = this.getBridgeFunction('storageClear', 'clear');
        if (!clearFn) {
            return;
        }

        try {
            clearFn();
        } catch (error) {
            console.error('[AndroidStorageAdapter] Failed to clear storage:', error);
        }
    }

    private getBridgeFunction(...candidates: string[]): ((...args: any[]) => any) | null {
        if (!this.androidBridge) {
            return null;
        }

        for (const name of candidates) {
            const candidate = this.androidBridge[name];
            if (typeof candidate === 'function') {
                return candidate.bind(this.androidBridge);
            }
        }

        return null;
    }
}
