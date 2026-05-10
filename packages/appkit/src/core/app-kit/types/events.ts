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

/**
 * Payload of `connector:added` events — the connector that was just registered.
 *
 * @public
 * @category Type
 * @section Core
 */
export interface ConnectorAddedPayload {
    /** {@link Connector} just registered with AppKit. */
    connector: Connector;
}

/**
 * Payload of `connector:removed` events — the connector that was just unregistered.
 *
 * @public
 * @category Type
 * @section Core
 */
export interface ConnectorRemovedPayload {
    /** {@link Connector} just unregistered from AppKit (already torn down via `destroy()`). */
    connector: Connector;
}

/**
 * Payload of `connector:wallets-updated` events — fired by a connector when its connected-wallets list changes (connect, disconnect, or account switch inside the wallet).
 *
 * @public
 * @category Type
 * @section Core
 */
export interface ConnectorWalletsUpdatedPayload {
    /** Id of the {@link Connector} whose wallets just changed. */
    connectorId: string;
    /** Wallets currently exposed by the connector — empty when the wallet was just disconnected. */
    wallets: WalletInterface[];
}

/**
 * Payload of `networks:default-changed` events — the new default network, or `undefined` when cleared.
 *
 * @public
 * @category Type
 * @section Core
 */
export interface DefaultNetworkChangedPayload {
    /** New default network, or `undefined` when the constraint is cleared. */
    network: Network | undefined;
}

/**
 * Map of every event name AppKit can emit to its payload type, used to type listeners on {@link AppKitEmitter}.
 *
 * @public
 * @category Type
 * @section Core
 */
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

/**
 * Strongly-typed event emitter exposed as {@link AppKit}`.emitter`; `appKit.emitter.on(name, handler)` returns an unsubscribe function.
 *
 * @public
 * @category Type
 * @section Core
 */
export type AppKitEmitter = EventEmitter<AppKitEvents>;
