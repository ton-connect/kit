/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * WalletKit bridge event primitives shared between the native layer and the JS bridge.
 */
export type WalletKitBridgeEventType =
    | 'ready'
    | 'connectRequest'
    | 'transactionRequest'
    | 'signDataRequest'
    | 'signMessage'
    | 'disconnect'
    | 'requestError'
    | 'browserPageStarted'
    | 'browserPageFinished'
    | 'browserError'
    | 'browserBridgeRequest'
    | (string & {});

export interface WalletKitBridgeEvent<T = unknown> {
    type: WalletKitBridgeEventType;
    data?: T;
}

export type WalletKitBridgeEventHandler = (event: WalletKitBridgeEvent) => void;

export type WalletKitBridgeEventCallback = (
    type: WalletKitBridgeEventType,
    event: WalletKitBridgeEvent['data'],
) => void;
