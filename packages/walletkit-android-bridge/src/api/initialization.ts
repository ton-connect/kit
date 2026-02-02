/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * initialization.ts – Bridge initialization and event listeners
 *
 * Simplified bridge for WalletKit initialization and event listener management.
 */

import type { WalletKitBridgeInitConfig, SetEventsListenersArgs, WalletKitBridgeEventCallback } from '../types';
import { ensureWalletKitLoaded } from '../core/moduleLoader';
import { initTonWalletKit, requireWalletKit } from '../core/initialization';
import { emit } from '../transport/messaging';
import { postToNative } from '../transport/nativeBridge';
import { eventListeners } from './eventListeners';
import { AndroidStorageAdapter } from '../adapters/AndroidStorageAdapter';

/**
 * Sets up WalletKit with the provided configuration.
 */
export async function init(config?: WalletKitBridgeInitConfig) {
    await ensureWalletKitLoaded();

    return await initTonWalletKit(config, {
        emit,
        postToNative,
        AndroidStorageAdapter,
    });
}

/**
 * Registers bridge event listeners, proxying WalletKit events to the native layer.
 */
export function setEventsListeners(args?: SetEventsListenersArgs): { ok: true } {
    const kit = requireWalletKit();

    const callback: WalletKitBridgeEventCallback =
        args?.callback ??
        ((type, event) => {
            emit(type, event);
        });

    if (eventListeners.onConnectListener) {
        kit.removeConnectRequestCallback();
    }

    eventListeners.onConnectListener = (event: unknown) => {
        callback('connectRequest', event);
    };

    kit.onConnectRequest(eventListeners.onConnectListener);

    if (eventListeners.onTransactionListener) {
        kit.removeTransactionRequestCallback();
    }

    eventListeners.onTransactionListener = (event: unknown) => {
        callback('transactionRequest', event);
    };

    kit.onTransactionRequest(eventListeners.onTransactionListener);

    if (eventListeners.onSignDataListener) {
        kit.removeSignDataRequestCallback();
    }

    eventListeners.onSignDataListener = (event: unknown) => {
        callback('signDataRequest', event);
    };

    kit.onSignDataRequest(eventListeners.onSignDataListener);

    if (eventListeners.onDisconnectListener) {
        kit.removeDisconnectCallback();
    }

    eventListeners.onDisconnectListener = (event: unknown) => {
        callback('disconnect', event);
    };

    kit.onDisconnect(eventListeners.onDisconnectListener);

    // Register error listener - forwards EventRequestError directly
    if (eventListeners.onErrorListener) {
        kit.removeErrorCallback();
    }

    eventListeners.onErrorListener = (event: unknown) => {
        callback('requestError', event);
    };

    kit.onRequestError(eventListeners.onErrorListener);

    return { ok: true };
}

/**
 * Removes all previously registered bridge event listeners.
 */
export function removeEventListeners(): { ok: true } {
    const kit = requireWalletKit();

    if (eventListeners.onConnectListener) {
        kit.removeConnectRequestCallback();
        eventListeners.onConnectListener = null;
    }

    if (eventListeners.onTransactionListener) {
        kit.removeTransactionRequestCallback();
        eventListeners.onTransactionListener = null;
    }

    if (eventListeners.onSignDataListener) {
        kit.removeSignDataRequestCallback();
        eventListeners.onSignDataListener = null;
    }

    if (eventListeners.onDisconnectListener) {
        kit.removeDisconnectCallback();
        eventListeners.onDisconnectListener = null;
    }

    if (eventListeners.onErrorListener) {
        kit.removeErrorCallback();
        eventListeners.onErrorListener = null;
    }

    return { ok: true };
}
