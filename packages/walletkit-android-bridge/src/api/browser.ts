/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Internal browser events dispatched back to the native layer.
 */
import { emit } from '../transport/messaging';

export function emitBrowserPageStarted(args: { url: string }) {
    emit('browserPageStarted', args);
    return { success: true };
}

export function emitBrowserPageFinished(args: { url: string }) {
    emit('browserPageFinished', args);
    return { success: true };
}

export function emitBrowserError(args: { message: string }) {
    emit('browserError', args);
    return { success: true };
}

export function emitBrowserBridgeRequest(args: { messageId: string; method: string; request: unknown }) {
    emit('browserBridgeRequest', args);
    return { success: true };
}
