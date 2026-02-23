/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { BridgePayload } from '../types';
import { bigIntReplacer } from '../utils/serialization';
import { warn, error, info } from '../utils/logger';

// Reverse-RPC: JS sends {kind:'request', id, method, params} via postMessage.
// Kotlin responds via window.__walletkitResponse(id, resultJson, errorJson).

const pendingRequests = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();
let nextRequestId = 1;

/**
 * Synchronous bridge call via @JavascriptInterface (WalletKitNative.adapterCallSync).
 * Used for sync WalletAdapter getters that cannot be async.
 */
export function bridgeRequestSync(method: string, params: Record<string, unknown>): string {
    const native = window.WalletKitNative;
    if (!native || typeof native.adapterCallSync !== 'function') {
        throw new Error('WalletKitNative.adapterCallSync not available');
    }
    return native.adapterCallSync(method, JSON.stringify(params));
}

/**
 * Send a request to Kotlin via postMessage and wait for a response.
 */
export function bridgeRequest(method: string, params: Record<string, unknown>): Promise<unknown> {
    const id = `req_${nextRequestId++}`;
    return new Promise<unknown>((resolve, reject) => {
        pendingRequests.set(id, { resolve, reject });
        postToNative({ kind: 'request', id, method, params });
    });
}

export function registerNativeResponseHandler(): void {
    window.__walletkitResponse = (id: string, resultJson?: string | null, errorJson?: string | null) => {
        const entry = pendingRequests.get(id);
        if (!entry) {
            warn('[walletkitBridge] __walletkitResponse: no pending request for id', id);
            return;
        }
        pendingRequests.delete(id);

        if (errorJson) {
            try {
                const err = JSON.parse(errorJson);
                entry.reject(new Error(err.message ?? 'Native request failed'));
            } catch {
                entry.reject(new Error(errorJson));
            }
            return;
        }

        if (resultJson) {
            try {
                entry.resolve(JSON.parse(resultJson));
            } catch {
                // If it's not JSON, return the raw string
                entry.resolve(resultJson);
            }
        } else {
            entry.resolve(undefined);
        }
    };
    info('[walletkitBridge] __walletkitResponse handler registered');
}

/**
 * Resolves WalletKit's native bridge implementation exposed on the global scope.
 */
export function resolveNativeBridge(scope: typeof globalThis) {
    const candidate = (scope as typeof globalThis & { WalletKitNative?: { postMessage?: (json: string) => void } })
        .WalletKitNative;
    if (candidate && typeof candidate.postMessage === 'function') {
        return candidate.postMessage.bind(candidate);
    }
    const windowRef = typeof scope.window === 'object' && scope.window ? scope.window : undefined;
    const windowCandidate = windowRef?.WalletKitNative;
    if (windowCandidate && typeof windowCandidate.postMessage === 'function') {
        return windowCandidate.postMessage.bind(windowCandidate);
    }
    return null;
}

/**
 * Resolves the Android bridge exposed by the host WebView.
 */
export function resolveAndroidBridge(scope: typeof globalThis) {
    const candidate = (scope as typeof globalThis & { AndroidBridge?: { postMessage?: (json: string) => void } })
        .AndroidBridge;
    if (candidate && typeof candidate.postMessage === 'function') {
        return candidate.postMessage.bind(candidate);
    }
    const windowRef = typeof scope.window === 'object' && scope.window ? scope.window : undefined;
    const windowCandidate = windowRef?.AndroidBridge;
    if (windowCandidate && typeof windowCandidate.postMessage === 'function') {
        return windowCandidate.postMessage.bind(windowCandidate);
    }
    return null;
}

/**
 * Sends a payload to the native bridge, falling back to debug logging when unavailable.
 */
export function postToNative(payload: BridgePayload): void {
    if (payload === null || (typeof payload !== 'object' && typeof payload !== 'function')) {
        const diagnostic = {
            type: typeof payload,
            value: payload,
            stack: new Error('postToNative non-object payload').stack,
        };
        error('[walletkitBridge] postToNative received non-object payload', diagnostic);
        throw new Error('Invalid payload - must be an object');
    }
    const json = JSON.stringify(payload, bigIntReplacer);
    const nativePostMessage = resolveNativeBridge(window);
    if (nativePostMessage) {
        nativePostMessage(json);
        return;
    }
    const androidPostMessage = resolveAndroidBridge(window);
    if (androidPostMessage) {
        androidPostMessage(json);
        return;
    }
    if (payload.kind === 'event') {
        throw new Error('Native bridge not available - cannot deliver event');
    }
    warn('[walletkitBridge] postToNative: no native handler', payload);
}
