/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Events Feature
 *
 * Centralized event system for AppKit plugin communication.
 * Provides EventBus implementation and predefined event types.
 */
export { EventBus } from './services/event-bus';
export type { EventPayload, AppKitEvent, EventListener } from './types/event-bus';
export { PROVIDER_EVENTS, WALLETS_EVENTS, PLUGIN_EVENTS } from './constants/events';
export type {
    WalletConnectedPayload,
    WalletDisconnectedPayload,
    WalletChangedPayload,
    PluginRegisteredPayload,
} from './types/payload';
