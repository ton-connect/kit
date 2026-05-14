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
    ADDED: 'connector:added',
    REMOVED: 'connector:removed',
    WALLETS_UPDATED: 'connector:wallets-updated',
} as const;

/**
 * Wallet events
 */
export const WALLETS_EVENTS = {
    UPDATED: 'wallets:updated',
    SELECTION_CHANGED: 'wallets:selection-changed',
} as const;

/**
 * Networks events
 */
export const NETWORKS_EVENTS = {
    UPDATED: 'networks:updated',
    DEFAULT_CHANGED: 'networks:default-changed',
} as const;
