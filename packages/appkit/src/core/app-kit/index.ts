/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export { AppKit } from './services/app-kit';
export { CONNECTOR_EVENTS, WALLETS_EVENTS, PLUGIN_EVENTS } from './constants/events';

export type { AppKitConfig } from './types/config';
export type {
    AppKitEmitter,
    AppKitEvents,
    WalletConnectedPayload,
    WalletDisconnectedPayload,
    PluginRegisteredPayload,
} from './types/events';
