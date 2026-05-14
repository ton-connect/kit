/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Connector } from '../../../types/connector';
import type { Network } from '../../../types/network';
import type { CONNECTOR_EVENTS, WALLETS_EVENTS, NETWORKS_EVENTS } from '../constants/events';
import type { SharedKitEvents } from '../../emitter';
import type { EventEmitter } from '../../emitter';
import type { WalletInterface } from '../../../types/wallet';

export interface ConnectorAddedPayload {
    connector: Connector;
}

export interface ConnectorRemovedPayload {
    connector: Connector;
}

export interface ConnectorWalletsUpdatedPayload {
    connectorId: string;
    wallets: WalletInterface[];
}

export interface DefaultNetworkChangedPayload {
    network: Network | undefined;
}

export type AppKitEvents = {
    // Connector events
    [CONNECTOR_EVENTS.ADDED]: ConnectorAddedPayload;
    [CONNECTOR_EVENTS.REMOVED]: ConnectorRemovedPayload;
    [CONNECTOR_EVENTS.WALLETS_UPDATED]: ConnectorWalletsUpdatedPayload;

    // Wallets events
    [WALLETS_EVENTS.UPDATED]: { wallets: WalletInterface[] };
    [WALLETS_EVENTS.SELECTION_CHANGED]: { walletId: string | null };

    // Networks events
    [NETWORKS_EVENTS.UPDATED]: Record<string, never>;
    [NETWORKS_EVENTS.DEFAULT_CHANGED]: DefaultNetworkChangedPayload;
} & SharedKitEvents;

export type AppKitEmitter = EventEmitter<AppKitEvents>;
