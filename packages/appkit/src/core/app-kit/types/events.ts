/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from '../../../types/network';
import type { CONNECTOR_EVENTS, WALLETS_EVENTS, NETWORKS_EVENTS } from '../constants/events';
import type { SharedKitEvents } from '../../emitter';
import type { EventEmitter } from '../../emitter';
import type { WalletInterface } from '../../../types/wallet';

/**
 * Payload of `connector:connected` events — newly connected wallets and the originating connector id.
 *
 * @public
 * @category Type
 * @section Core
 */
export interface WalletConnectedPayload {
    /** Wallets newly available through the connector after the connect handshake. */
    wallets: WalletInterface[];
    /** Id of the {@link Connector} that produced the connection. */
    connectorId: string;
}

/**
 * Payload of `connector:disconnected` events — id of the connector whose wallet was just disconnected.
 *
 * @public
 * @category Type
 * @section Core
 */
export interface WalletDisconnectedPayload {
    /** Id of the {@link Connector} whose wallet was just disconnected. */
    connectorId: string;
}

/**
 * Payload of `networks:default-changed` events — the new default network, or `undefined` when cleared.
 *
 * @public
 * @category Type
 * @section Core
 */
export interface DefaultNetworkChangedPayload {
    /** New default network, or `undefined` when the constraint was cleared. */
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
    [CONNECTOR_EVENTS.CONNECTED]: WalletConnectedPayload;
    [CONNECTOR_EVENTS.DISCONNECTED]: WalletDisconnectedPayload;

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
