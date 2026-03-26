/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    SendTransactionRequestEvent,
    RequestErrorEvent,
    DisconnectionEvent,
    SignDataRequestEvent,
    ConnectionRequestEvent,
} from '../api/models';

export interface TonConnectEventsHandler {
    handleConnectRequest(event: ConnectionRequestEvent): void | Promise<void>;
    handleSendTransactionRequest(event: SendTransactionRequestEvent): void | Promise<void>;
    handleSignDataRequest(event: SignDataRequestEvent): void | Promise<void>;
    handleDisconnection(event: DisconnectionEvent): void | Promise<void>;
    handleRequestError(event: RequestErrorEvent): void | Promise<void>;
}
