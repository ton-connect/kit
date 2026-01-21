/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type {
    ConnectionEvent,
    ConnectionRestoringEvent,
    DisconnectionEvent,
    DataSigningEvent,
    TransactionSigningEvent,
    VersionEvent,
    WalletModalOpenedEvent,
    SelectedWalletEvent,
} from '@ton/appkit';

/**
 * User action events.
 */
export type UserActionEvent =
    | VersionEvent
    | ConnectionEvent
    | ConnectionRestoringEvent
    | DisconnectionEvent
    | TransactionSigningEvent
    | DataSigningEvent
    | WalletModalOpenedEvent
    | SelectedWalletEvent;

export {
    createRequestVersionEvent,
    createResponseVersionEvent,
    createConnectionStartedEvent,
    createConnectionErrorEvent,
    createConnectionCompletedEvent,
    createConnectionRestoringStartedEvent,
    createConnectionRestoringErrorEvent,
    createConnectionRestoringCompletedEvent,
    createDisconnectionEvent,
    createTransactionSentForSignatureEvent,
    createTransactionSigningFailedEvent,
    createTransactionSignedEvent,
    createWalletModalOpenedEvent,
    createSelectedWalletEvent,
} from '@ton/appkit';
