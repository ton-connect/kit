/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Wallet as WalletInterface } from '@ton/walletkit';

/**
 * Wallet events
 */
export const WALLET_EVENTS = {
    CONNECTED: 'wallet:connected',
    DISCONNECTED: 'wallet:disconnected',
    CHANGED: 'wallet:changed',
} as const;

export interface WalletConnectedPayload {
    wallets: WalletInterface[];
    providerId: string;
}

export interface WalletDisconnectedPayload {
    providerId: string;
}

export interface WalletChangedPayload {
    wallets: WalletInterface[];
    providerId: string;
}

/**
 * Plugin events
 */
export const PLUGIN_EVENTS = {
    REGISTERED: 'plugin:registered',
} as const;

export interface PluginRegisteredPayload {
    pluginId: string;
    pluginType: string;
}
