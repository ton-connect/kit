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

type ConnectEventListener = ((event: ConnectionRequestEvent) => void) | null;
type TransactionEventListener = ((event: SendTransactionRequestEvent) => void) | null;
type SignDataEventListener = ((event: SignDataRequestEvent) => void) | null;
type DisconnectEventListener = ((event: DisconnectionEvent) => void) | null;
type ErrorEventListener = ((event: RequestErrorEvent) => void) | null;

type _BridgeEventListener =
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
