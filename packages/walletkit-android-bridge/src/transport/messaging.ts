/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { WalletKitBridgeEvent, WalletKitBridgeApi, WalletKitApiMethod, CallContext } from '../types';
import { postToNative } from './nativeBridge';
import { error } from '../utils/logger';

let apiRef: WalletKitBridgeApi | undefined;

export function emit(type: WalletKitBridgeEvent['type'], data?: WalletKitBridgeEvent['data']): void {
    const event: WalletKitBridgeEvent = { type, data };
    postToNative({ kind: 'event', event });
}

export function respond(id: string, result?: unknown, error?: { message: string }): void {
    postToNative({ kind: 'response', id, result, error });
}

export function setBridgeApi(api: WalletKitBridgeApi): void {
    apiRef = api;
}

async function invokeApiMethod(
    api: WalletKitBridgeApi,
    method: WalletKitApiMethod,
    params: unknown,
    context: CallContext,
): Promise<unknown> {
    const fn = api[method];
    if (typeof fn !== 'function') {
        throw new Error(`Unknown method ${String(method)}`);
    }
    const value = await (fn as (args: unknown, context?: CallContext) => Promise<unknown> | unknown).call(
        api,
        params as never,
        context,
    );
    return value;
}

export async function handleCall(id: string, method: WalletKitApiMethod, params?: unknown): Promise<void> {
    if (!apiRef) {
        throw new Error('Bridge API not registered');
    }
    try {
        const context: CallContext = { id, method };
        const value = await invokeApiMethod(apiRef, method, params, context);
        respond(id, value);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        error(`[walletkitBridge] handleCall error for ${method}:`, message);
        respond(id, undefined, { message });
    }
}

/**
 * Handle an inbound `{kind:'call'}` envelope dispatched from Kotlin via the port.
 * Replaces the legacy `window.__walletkitCall` global.
 */
export function handleNativeCall(id: string, method: WalletKitApiMethod, params: unknown): void {
    void handleCall(id, method, params);
}
