/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Shared event listener references used to manage WalletKit callbacks.
 */
export type BridgeEventListener = ((event: unknown) => void) | null;

export const eventListeners = {
    onConnectListener: null as BridgeEventListener,
    onTransactionListener: null as BridgeEventListener,
    onSignDataListener: null as BridgeEventListener,
    onDisconnectListener: null as BridgeEventListener,
};
