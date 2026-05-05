/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { WalletKitApiMethod, WalletKitBridgeApi } from './types';
import { api } from './api';
import { handleNativeCall, setBridgeApi } from './transport/messaging';
import { handleNativeResponse } from './transport/nativeBridge';
import { installPortHandshake, setInboundCallback } from './transport/port';
import { warn, error } from './utils/logger';

declare global {
    interface Window {
        walletkitBridge?: WalletKitBridgeApi;
    }
}

interface IncomingCallEnvelope {
    kind: 'call';
    id: string;
    method: WalletKitApiMethod;
    params?: unknown;
}

interface IncomingResponseEnvelope {
    kind: 'response';
    id: string;
    result?: unknown;
    error?: { message?: string };
}

type IncomingEnvelope = IncomingCallEnvelope | IncomingResponseEnvelope;

setBridgeApi(api as unknown as WalletKitBridgeApi);

// Synchronous: must be in place before native onPageFinished posts the port.
installPortHandshake();

setInboundCallback((json) => {
    let envelope: IncomingEnvelope;
    try {
        envelope = JSON.parse(json) as IncomingEnvelope;
    } catch (err) {
        error('[walletkitBridge] Failed to parse inbound port message', err, json);
        return;
    }
    switch (envelope.kind) {
        case 'call':
            handleNativeCall(envelope.id, envelope.method, envelope.params);
            break;
        case 'response':
            handleNativeResponse(envelope.id, envelope.result, envelope.error);
            break;
        default: {
            const exhaustive: never = envelope;
            warn('[walletkitBridge] Unknown inbound envelope kind', exhaustive);
        }
    }
});

window.walletkitBridge = api as unknown as WalletKitBridgeApi;
