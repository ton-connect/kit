/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

export { createEventBus } from './event-bus';
export type { EventBus, EventPayload, AppKitEvent, EventListener } from './event-bus';
export {
    WALLET_EVENTS,
    PLUGIN_EVENTS,
    type WalletConnectedPayload,
    type WalletDisconnectedPayload,
    type WalletChangedPayload,
    type PluginRegisteredPayload,
} from './events';
