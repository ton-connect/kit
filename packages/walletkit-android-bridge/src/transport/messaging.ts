/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Messaging helpers that mediate between the native bridge and WalletKit APIs.
 */
import type { WalletKitBridgeEvent, WalletKitBridgeApi, WalletKitApiMethod, CallContext } from '../types';
import { postToNative } from './nativeBridge';
import { emitCallDiagnostic } from './diagnostics';
import { error } from '../utils/logger';

let apiRef: WalletKitBridgeApi | undefined;

/**
 * Emits a bridge event to the native layer.
 *
 * @param type - Event type identifier.
 * @param data - Optional event payload.
 */
export function emit(type: WalletKitBridgeEvent['type'], data?: WalletKitBridgeEvent['data']): void {
    const event: WalletKitBridgeEvent = { type, data };
    postToNative({ kind: 'event', event });
}

/**
 * Sends a response payload (or error) back to the native layer.
 *
 * @param id - Native call identifier.
 * @param result - Optional result payload.
 * @param error - Optional error to report.
 */
export function respond(id: string, result?: unknown, error?: { message: string }): void {
    postToNative({ kind: 'response', id, result, error });
}

/**
 * Registers the active API implementation that will service native calls.
 *
 * @param api - WalletKit bridge API surface.
 */
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

/**
 * Handles a native call by invoking the corresponding WalletKit bridge method.
 *
 * @param id - Native call identifier.
 * @param method - API method name.
 * @param params - Optional serialized parameters.
 */
export async function handleCall(id: string, method: WalletKitApiMethod, params?: unknown): Promise<void> {
    if (!apiRef) {
        throw new Error('Bridge API not registered');
    }
    emitCallDiagnostic(id, method, 'start');
    try {
        const context: CallContext = { id, method };
        const value = await invokeApiMethod(apiRef, method, params, context);
        emitCallDiagnostic(id, method, 'success');
        respond(id, value);
    } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        error(`[walletkitBridge] handleCall error for ${method}:`, message);
        emitCallDiagnostic(id, method, 'error', message);
        respond(id, undefined, { message });
    }
}

/**
 * Registers the global handler that native code invokes to call into the bridge.
 */
export function registerNativeCallHandler(): void {
    window.__walletkitCall = (id, method, paramsJson) => {
        let params: unknown = undefined;
        if (paramsJson && paramsJson !== 'null') {
            try {
                params = JSON.parse(paramsJson);
            } catch {
                respond(id, undefined, { message: 'Invalid params JSON' });
                return;
            }
        }
        void handleCall(id, method, params);
    };
}
