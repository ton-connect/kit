/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { v7 as uuidv7 } from 'uuid';

import type { BridgePayload } from '../types';
import { bigIntReplacer } from '../utils/serialization';
import { warn, error } from '../utils/logger';
import { sendToNative } from './port';

// Reverse-RPC: JS sends {kind:'request', id, method, params} via the WebMessagePort.
// Kotlin replies with {kind:'response', id, result?, error?} on the same port.

const pendingRequests = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

/**
 * Synchronous bridge call via @JavascriptInterface (WalletKitNative.adapterCallSync).
 * Used for sync WalletAdapter getters that cannot be async. Stays on the legacy
 * channel — sync WebView calls cannot use the async WebMessagePort.
 */
export function bridgeRequestSync(method: string, params: Record<string, unknown>): string {
    const native = window.WalletKitNative;
    if (!native || typeof native.adapterCallSync !== 'function') {
        throw new Error('WalletKitNative.adapterCallSync not available');
    }
    return native.adapterCallSync(method, JSON.stringify(params));
}

/**
 * Send a request to Kotlin via the WebMessagePort and wait for a response.
 */
export function bridgeRequest(method: string, params: Record<string, unknown>): Promise<unknown> {
    const id = uuidv7();
    return new Promise<unknown>((resolve, reject) => {
        pendingRequests.set(id, { resolve, reject });
        postToNative({ kind: 'request', id, method, params });
    });
}

/**
 * Resolve a pending JS-side request with a result coming back from Kotlin.
 */
export function handleNativeResponse(id: string, resultJson: unknown, errorJson: unknown): void {
    const entry = pendingRequests.get(id);
    if (!entry) {
        warn('[walletkitBridge] handleNativeResponse: no pending request for id', id);
        return;
    }
    pendingRequests.delete(id);

    if (errorJson) {
        const err = errorJson as { message?: string };
        entry.reject(new Error(err.message ?? 'Native request failed'));
        return;
    }

    if (resultJson === null || resultJson === undefined) {
        entry.resolve(undefined);
        return;
    }

    if (typeof resultJson === 'string') {
        // Kotlin handlers return a JSON-encoded string for compatibility with the
        // legacy `__walletkitResponse(id, resultJson, errorJson)` contract.
        try {
            entry.resolve(JSON.parse(resultJson));
        } catch {
            // If it's not JSON (e.g. a hex value with no quotes from older handlers), pass it through.
            entry.resolve(resultJson);
        }
        return;
    }

    // Some future handler may return a typed value directly — accept it.
    entry.resolve(resultJson);
}

/**
 * Sends a payload to the native bridge via the WebMessagePort transport.
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
    sendToNative(json);
}
