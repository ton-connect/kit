/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TransactionEmulatedTrace } from '../api/models';
import type { RawBridgeEvent, RawBridgeEventRestoreConnection } from './internal';
import type { EventEmitter } from '../core/EventEmitter';
import type { StreamingEvents } from '../api/models';

/**
 * Events shared between all walletkit and appkit.
 */
export type SharedKitEvents = StreamingEvents;

/**
 * Definition of all events emitted by the TonWalletKit.
 */
export type WalletKitEvents = {
    restoreConnection: RawBridgeEventRestoreConnection;
    eventError: RawBridgeEvent;
    emulationResult: TransactionEmulatedTrace;
    bridgeStorageUpdated: object;
} & SharedKitEvents;

export type WalletKitEventEmitter = EventEmitter<WalletKitEvents>;
