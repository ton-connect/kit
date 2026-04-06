/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { ConnectRequest } from '@tonconnect/protocol';

import type { TransactionEmulatedTrace } from '../api/models';
import type { RawBridgeEvent, RawBridgeEventRestoreConnection } from './internal';
import type { EventEmitter } from '../core/EventEmitter';
import type { StreamingEvents } from '../api/models';

/**
 * Events shared between all walletkit and appkit.
 */
export type SharedKitEvents = StreamingEvents;

/**
 * Payload for the bridge-connect-with-intent event emitted when a JS Bridge
 * connectWithIntent() call arrives from the injected provider.
 */
export interface BridgeConnectWithIntentPayload {
    intentUrl: string;
    connectRequest?: ConnectRequest;
    tabId?: string;
    messageId?: string;
    walletId?: string;
}

/**
 * Definition of all events emitted by the TonWalletKit.
 */
export type WalletKitEvents = {
    restoreConnection: RawBridgeEventRestoreConnection;
    eventError: RawBridgeEvent;
    emulationResult: TransactionEmulatedTrace;
    bridgeStorageUpdated: object;
    'bridge-draft-intent': RawBridgeEvent;
    'bridge-connect-with-intent': BridgeConnectWithIntentPayload;
} & SharedKitEvents;

export type WalletKitEventEmitter = EventEmitter<WalletKitEvents>;
