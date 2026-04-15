/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export type WalletKitBridgeEventType =
    | 'ready'
    | 'connectRequest'
    | 'transactionRequest'
    | 'signDataRequest'
    | 'disconnect'
    | 'requestError'
    | 'browserPageStarted'
    | 'browserPageFinished'
    | 'browserError'
    | 'browserBridgeRequest'
    | 'streamingUpdate'
    | 'streamingConnectionChange'
    | 'streamingBalanceUpdate'
    | 'streamingTransactionsUpdate'
    | 'streamingJettonsUpdate'
    | (string & {});

export interface WalletKitBridgeEvent<T = unknown> {
    type: WalletKitBridgeEventType;
    data?: T;
}

export type WalletKitBridgeEventCallback = (
    type: WalletKitBridgeEventType,
    event: WalletKitBridgeEvent['data'],
) => void;
