import textEncoder from './textEncoder';
import { Buffer } from 'buffer';
import { URL, URLSearchParams } from 'whatwg-url';

type AnyGlobal = typeof globalThis & Record<string, unknown>;

function applyTextEncoder(target: AnyGlobal) {
  try {
    textEncoder(target as any);
  } catch (err) {
    console.error('[walletkitBridge] Failed to apply TextEncoder polyfill', err);
  }
}

function ensureFetch(target: AnyGlobal) {
  if (typeof target.fetch === 'undefined' && typeof window !== 'undefined' && typeof window.fetch === 'function') {
    target.fetch = window.fetch.bind(window);
  }
}

function ensureAbortController(target: AnyGlobal) {
  if (typeof target.AbortController === 'undefined') {
    class PolyfillAbortController implements AbortController {
      signal = {
        aborted: false,
        addEventListener() {},
        removeEventListener() {},
        dispatchEvent() { return true; },
        onabort: null,
        reason: undefined,
        throwIfAborted() {},
      } as AbortSignal;
      
      abort() {
        (this.signal as any).aborted = true;
      }
    }
    target.AbortController = PolyfillAbortController as any;
  }
}

function overrideLocalStorage(target: AnyGlobal) {
  // Check if we have the native bridge available
  const bridge = (target as any).AndroidBridge || (target as any).WalletKitNative;
  
  if (!bridge) {
    console.warn('[walletkitBridge] No native bridge found, localStorage will not be overridden');
    return;
  }

  // Validate that the bridge has storage methods
  if (typeof bridge.storageGet !== 'function' || 
      typeof bridge.storageSet !== 'function' || 
      typeof bridge.storageRemove !== 'function' || 
      typeof bridge.storageClear !== 'function') {
    console.warn('[walletkitBridge] Bridge is missing storage methods, localStorage will not be overridden');
    return;
  }

  // Create a secure storage implementation that redirects to the native bridge
  const secureStorage: Storage = {
    getItem(key: string): string | null {
      try {
        const value = bridge.storageGet(key);
        return value === undefined || value === null ? null : String(value);
      } catch (err) {
        console.error('[walletkitBridge] Error in localStorage.getItem:', err);
        return null;
      }
    },
    
    setItem(key: string, value: string): void {
      try {
        bridge.storageSet(key, String(value));
      } catch (err) {
        console.error('[walletkitBridge] Error in localStorage.setItem:', err);
      }
    },
    
    removeItem(key: string): void {
      try {
        bridge.storageRemove(key);
      } catch (err) {
        console.error('[walletkitBridge] Error in localStorage.removeItem:', err);
      }
    },
    
    clear(): void {
      try {
        bridge.storageClear();
      } catch (err) {
        console.error('[walletkitBridge] Error in localStorage.clear:', err);
      }
    },
    
    get length(): number {
      // Note: The native bridge doesn't provide a length method
      // This is a limitation but shouldn't affect most use cases
      return 0;
    },
    
    key(index: number): string | null {
      // Note: The native bridge doesn't provide a key enumeration method
      // This is a limitation but shouldn't affect most use cases
      return null;
    }
  };

  // Do NOT override the global localStorage (other libraries expect it).
  // Instead expose a namespaced storage object `WalletKitNativeStorage` which
  // delegates to the native bridge. Consumers of the SDK should use the
  // WalletKit storage adapter (or call window.WalletKitNativeStorage) when
  // they require secure/native persistence.
  try {
    const namespaced: any = {
      getItem(key: string) {
        try {
          const value = bridge.storageGet(key);
          return value === undefined || value === null ? null : String(value);
        } catch (err) {
          console.error('[walletkitBridge] Error in WalletKitNativeStorage.getItem:', err);
          return null;
        }
      },
      setItem(key: string, value: string) {
        try {
          bridge.storageSet(key, String(value));
        } catch (err) {
          console.error('[walletkitBridge] Error in WalletKitNativeStorage.setItem:', err);
        }
      },
      removeItem(key: string) {
        try {
          bridge.storageRemove(key);
        } catch (err) {
          console.error('[walletkitBridge] Error in WalletKitNativeStorage.removeItem:', err);
        }
      },
      clear() {
        try {
          bridge.storageClear();
        } catch (err) {
          console.error('[walletkitBridge] Error in WalletKitNativeStorage.clear:', err);
        }
      }
    };

    // Attach without clobbering existing properties
    if (typeof (target as any).WalletKitNativeStorage === 'undefined') {
      Object.defineProperty(target, 'WalletKitNativeStorage', {
        value: namespaced,
        writable: false,
        configurable: true
      });
      console.log('[walletkitBridge] ✅ WalletKitNativeStorage exposed for secure native storage');
    } else {
      console.warn('[walletkitBridge] WalletKitNativeStorage already present, not overriding');
    }
  } catch (err) {
    console.error('[walletkitBridge] Failed to expose WalletKitNativeStorage:', err);
  }
}

export function setupPolyfills() {
  const scopes: Array<AnyGlobal | undefined> = [
    typeof globalThis !== 'undefined' ? (globalThis as unknown as AnyGlobal) : undefined,
    typeof window !== 'undefined' ? (window as unknown as AnyGlobal) : undefined,
    typeof self !== 'undefined' ? (self as unknown as AnyGlobal) : undefined,
  ];

  scopes.forEach((scope) => {
    if (!scope) return;
    applyTextEncoder(scope);
    ensureFetch(scope);
    ensureAbortController(scope);
    overrideLocalStorage(scope);
    if (typeof scope.Buffer === 'undefined') {
      scope.Buffer = Buffer as any;
    }
    if (typeof scope.URL === 'undefined') {
      scope.URL = URL as any;
    }
    if (typeof scope.URLSearchParams === 'undefined') {
      scope.URLSearchParams = URLSearchParams as any;
    }
  });
}
