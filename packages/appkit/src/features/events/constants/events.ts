/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Provider events
 */
export const PROVIDER_EVENTS = {
    CONNECTED: 'provider:wallet-connected',
    DISCONNECTED: 'provider:wallet-disconnected',
} as const;

/**
 * Wallet events
 */
export const WALLETS_EVENTS = {
    UPDATED: 'wallets:updated',
} as const;

/**
 * Plugin events
 */
export const PLUGIN_EVENTS = {
    REGISTERED: 'plugin:registered',
} as const;
