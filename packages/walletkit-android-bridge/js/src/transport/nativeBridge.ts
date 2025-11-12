/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Native bridge helpers for posting messages to the Android host.
 */
import type { BridgePayload } from '../types';
import { bigIntReplacer } from '../utils/serialization';
import { debugLog, logError } from '../utils/logger';

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
        logError('[walletkitBridge] postToNative received non-object payload', diagnostic);
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
    debugLog('[walletkitBridge] → native (no handler)', payload);
}
