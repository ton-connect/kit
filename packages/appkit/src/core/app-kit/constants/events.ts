/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Event names AppKit emits for connector-list and connector-wallet changes; payloads are {@link ConnectorAddedPayload}, {@link ConnectorRemovedPayload} and {@link ConnectorWalletsUpdatedPayload}.
 *
 * @public
 * @category Constants
 * @section Connectors
 */
export const CONNECTOR_EVENTS = {
    /** A connector was registered via {@link addConnector} (or AppKit's constructor). */
    ADDED: 'connector:added',
    /** A connector was unregistered via `removeConnector` or its own teardown. */
    REMOVED: 'connector:removed',
    /** A connector's connected-wallets state changed (wallet connected, disconnected, or account switched inside the wallet). */
    WALLETS_UPDATED: 'connector:wallets-updated',
} as const;

/**
 * Event names AppKit emits when the available wallet list (`UPDATED`) or the active wallet (`SELECTION_CHANGED`) changes.
 *
 * @public
 * @category Constants
 * @section Wallets
 */
export const WALLETS_EVENTS = {
    UPDATED: 'wallets:updated',
    SELECTION_CHANGED: 'wallets:selection-changed',
} as const;

/**
 * Event names AppKit emits on network changes; `DEFAULT_CHANGED` carries a {@link DefaultNetworkChangedPayload}.
 *
 * @public
 * @category Constants
 * @section Networks
 */
export const NETWORKS_EVENTS = {
    UPDATED: 'networks:updated',
    DEFAULT_CHANGED: 'networks:default-changed',
} as const;
