/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { CONNECTOR_EVENTS, WALLETS_EVENTS, PLUGIN_EVENTS } from '../constants/events';
import type { WalletConnectedPayload, WalletDisconnectedPayload, PluginRegisteredPayload } from './payload';
import type { WalletInterface } from '../../../features/wallets';

export type EventPayload = object;

export interface AppKitEvent<T extends EventPayload = EventPayload> {
    type: string;
    payload: T;
    source: string;
    timestamp: number;
}

export type EventListener<T extends EventPayload = EventPayload> = (event: AppKitEvent<T>) => void;

export interface AppKitEvents {
    // Connector events
    [CONNECTOR_EVENTS.CONNECTED]: WalletConnectedPayload;
    [CONNECTOR_EVENTS.DISCONNECTED]: WalletDisconnectedPayload;

    // Wallets events
    [WALLETS_EVENTS.UPDATED]: { wallets: WalletInterface[] };
    [WALLETS_EVENTS.SELECTION_CHANGED]: { walletId: string | null };

    // Plugin events
    [PLUGIN_EVENTS.REGISTERED]: PluginRegisteredPayload;
}
