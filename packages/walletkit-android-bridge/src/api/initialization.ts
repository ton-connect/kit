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
import { walletKit } from '../core/state';
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
    requireWalletKit();

    const callback: WalletKitBridgeEventCallback =
        args?.callback ??
        ((type, event) => {
            emit(type, event);
        });

    if (eventListeners.onConnectListener) {
        walletKit.removeConnectRequestCallback();
    }

    eventListeners.onConnectListener = (event: unknown) => {
        callback('connectRequest', event);
    };

    walletKit.onConnectRequest(eventListeners.onConnectListener);

    if (eventListeners.onTransactionListener) {
        walletKit.removeTransactionRequestCallback();
    }

    eventListeners.onTransactionListener = (event: unknown) => {
        callback('transactionRequest', event);
    };

    walletKit.onTransactionRequest(eventListeners.onTransactionListener);

    if (eventListeners.onSignDataListener) {
        walletKit.removeSignDataRequestCallback();
    }

    eventListeners.onSignDataListener = (event: unknown) => {
        callback('signDataRequest', event);
    };

    walletKit.onSignDataRequest(eventListeners.onSignDataListener);

    if (eventListeners.onDisconnectListener) {
        walletKit.removeDisconnectCallback();
    }

    eventListeners.onDisconnectListener = (event: unknown) => {
        callback('disconnect', event);
    };

    walletKit.onDisconnect(eventListeners.onDisconnectListener);

    // Register error listener - forwards EventRequestError directly
    if (eventListeners.onErrorListener) {
        walletKit.removeErrorCallback();
    }

    eventListeners.onErrorListener = (event: unknown) => {
        callback('requestError', event);
    };

    walletKit.onRequestError(eventListeners.onErrorListener);

    return { ok: true };
}

/**
 * Removes all previously registered bridge event listeners.
 */
export function removeEventListeners(): { ok: true } {
    requireWalletKit();

    if (eventListeners.onConnectListener) {
        walletKit.removeConnectRequestCallback();
        eventListeners.onConnectListener = null;
    }

    if (eventListeners.onTransactionListener) {
        walletKit.removeTransactionRequestCallback();
        eventListeners.onTransactionListener = null;
    }

    if (eventListeners.onSignDataListener) {
        walletKit.removeSignDataRequestCallback();
        eventListeners.onSignDataListener = null;
    }

    if (eventListeners.onDisconnectListener) {
        walletKit.removeDisconnectCallback();
        eventListeners.onDisconnectListener = null;
    }

    if (eventListeners.onErrorListener) {
        walletKit.removeErrorCallback();
        eventListeners.onErrorListener = null;
    }

    return { ok: true };
}
