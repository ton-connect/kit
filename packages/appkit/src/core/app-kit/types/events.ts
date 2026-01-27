/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Emitter } from '../../events';
import type { CONNECTOR_EVENTS, WALLETS_EVENTS, PLUGIN_EVENTS } from '../constants/events';
import type { WalletInterface } from '../../../features/wallets';

export interface WalletConnectedPayload {
    wallets: WalletInterface[];
    connectorId: string;
}

export interface WalletDisconnectedPayload {
    connectorId: string;
}

export interface PluginRegisteredPayload {
    pluginId: string;
    pluginType: string;
}

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

export type AppKitEmitter = Emitter<AppKitEvents>;
