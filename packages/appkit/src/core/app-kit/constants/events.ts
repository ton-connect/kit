/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Connector events
 */
export const CONNECTOR_EVENTS = {
    CONNECTED: 'connector:connected',
    DISCONNECTED: 'connector:disconnected',
} as const;

/**
 * Wallet events
 */
export const WALLETS_EVENTS = {
    UPDATED: 'wallets:updated',
    SELECTION_CHANGED: 'wallets:selection-changed',
} as const;

/**
 * Plugin events
 */
export const PLUGIN_EVENTS = {
    REGISTERED: 'plugin:registered',
} as const;
