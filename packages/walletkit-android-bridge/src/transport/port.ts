/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { warn, error } from '../utils/logger';

const HANDSHAKE_TAG = '__walletkit_bridge_init';

let port: MessagePort | null = null;
let inboundCallback: ((json: string) => void) | null = null;
const pendingOutbound: string[] = [];

function flushPending(p: MessagePort): void {
    while (pendingOutbound.length > 0) {
        const next = pendingOutbound.shift() as string;
        p.postMessage(next);
    }
}

export function sendToNative(json: string): void {
    if (port) {
        port.postMessage(json);
        return;
    }
    pendingOutbound.push(json);
}

export function setInboundCallback(callback: (json: string) => void): void {
    inboundCallback = callback;
}

// Must run synchronously during bundle parse — Kotlin posts the port from
// WebViewClient.onPageFinished and the listener has to be in place by then.
export function installPortHandshake(): void {
    window.addEventListener('message', event => {
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
