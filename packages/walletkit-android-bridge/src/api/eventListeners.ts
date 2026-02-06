/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    ConnectionRequestEvent,
    DisconnectionEvent,
    RequestErrorEvent,
    SendTransactionRequestEvent,
    SignDataRequestEvent,
} from '@ton/walletkit';

/**
 * Shared event listener references used to manage WalletKit callbacks.
 */
export type ConnectEventListener = ((event: ConnectionRequestEvent) => void) | null;
export type TransactionEventListener = ((event: SendTransactionRequestEvent) => void) | null;
export type SignDataEventListener = ((event: SignDataRequestEvent) => void) | null;
export type DisconnectEventListener = ((event: DisconnectionEvent) => void) | null;
export type ErrorEventListener = ((event: RequestErrorEvent) => void) | null;

/**
 * Union type for all bridge event listeners.
 */
export type BridgeEventListener =
    | ConnectEventListener
    | TransactionEventListener
    | SignDataEventListener
    | DisconnectEventListener
    | ErrorEventListener;

export const eventListeners = {
    onConnectListener: null as ConnectEventListener,
    onTransactionListener: null as TransactionEventListener,
    onSignDataListener: null as SignDataEventListener,
    onDisconnectListener: null as DisconnectEventListener,
    onErrorListener: null as ErrorEventListener,
};
