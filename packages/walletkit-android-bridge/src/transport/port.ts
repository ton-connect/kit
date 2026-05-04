/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { warn, error } from '../utils/logger';

/**
 * WebMessagePort transport between Kotlin (Android WebViewCompat) and the JS bundle.
 *
 * Replaces the previous combination of `window.WalletKitNative.postMessage(json)` (JS→Kotlin)
 * and `window.__walletkitCall / __walletkitResponse` script-injection (Kotlin→JS) with a
 * single symmetrical port. The port is handed off by Kotlin via
 * `WebViewCompat.postWebMessage(view, WebMessageCompat("__walletkit_bridge_init", [jsPort]))`
 * once `WebViewClient.onPageFinished` fires; we capture it from `window.onmessage`.
 */

const HANDSHAKE_TAG = '__walletkit_bridge_init';

let port: MessagePort | null = null;
let inboundCallback: ((json: string) => void) | null = null;

// Buffer outbound messages emitted before the port handshake completes. JS code (e.g.
// the api facade) may try to call into Kotlin synchronously during bundle init, before
// Kotlin has even been given the chance to fire `onPageFinished`. We hold the writes
// until the port arrives, then drain in order.
const pendingOutbound: string[] = [];

function flushPending(p: MessagePort): void {
    while (pendingOutbound.length > 0) {
        const next = pendingOutbound.shift() as string;
        p.postMessage(next);
    }
}

/**
 * Send a JSON envelope to Kotlin. Buffers if the port hasn't been handed off yet.
 */
export function sendToNative(json: string): void {
    if (port) {
        port.postMessage(json);
        return;
    }
    pendingOutbound.push(json);
}

/**
 * Register the inbound callback. Invoked with the raw JSON string from each
 * `port.onmessage` event so the caller can dispatch to existing JSON-shape handlers.
 */
export function setInboundCallback(callback: (json: string) => void): void {
    inboundCallback = callback;
}

/**
 * Install the `window.message` listener that picks up the port handoff from Kotlin.
 * Must be called before `WebViewClient.onPageFinished` fires on the native side —
 * imported from `bridge.ts` at top-level so it runs synchronously during bundle parse.
 */
export function installPortHandshake(): void {
    window.addEventListener('message', event => {
        // The handshake message body is the literal HANDSHAKE_TAG; the port is in
        // event.ports[0]. Subsequent messages from Kotlin arrive on the port itself.
        if (event.data !== HANDSHAKE_TAG) {
            warn('[walletkitBridge] Ignoring window message — not the handshake tag', event.data);
            return;
        }
        const incoming = event.ports?.[0];
        if (!incoming) {
            error('[walletkitBridge] Handshake message had no port');
            return;
        }
        if (port) {
            warn('[walletkitBridge] Bridge port already initialised — ignoring duplicate handshake');
            return;
        }
        incoming.onmessage = e => {
            const data = typeof e.data === 'string' ? e.data : JSON.stringify(e.data);
            const cb = inboundCallback;
            if (!cb) {
                warn('[walletkitBridge] Inbound port message arrived before callback was installed');
                return;
            }
            cb(data);
        };
        incoming.start();
        port = incoming;
        flushPending(port);
    });
}
