/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Strongly-typed event emitter built on a string event name → payload type map; backs {@link AppKit}`.emitter` and any custom emitters apps create. `appKit.emitter.on(name, handler)` returns an unsubscribe function.
 *
 * @extract
 * @public
 * @category Class
 * @section Core
 */
export { EventEmitter } from '@ton/walletkit';

/**
 * Generic event-payload constraint — an `object` that the typed event-name → payload map maps to.
 *
 * @extract
 * @public
 * @category Type
 * @section Core
 */
export type { EventPayload } from '@ton/walletkit';

/**
 * Envelope every {@link EventEmitter} listener receives — `type` is the event name, `payload` is the event-specific data, `source` identifies who emitted it, and `timestamp` is the wall-clock millisecond mark.
 *
 * @extract
 * @public
 * @category Type
 * @section Core
 */
export type { KitEvent } from '@ton/walletkit';

/**
 * Listener callback signature accepted by {@link EventEmitter}.on — receives a {@link KitEvent} for the given event type and may return a Promise the emitter awaits.
 *
 * @extract
 * @public
 * @category Type
 * @section Core
 */
export type { EventListener } from '@ton/walletkit';

/**
 * Event-name → payload map shared between AppKit and walletkit; AppKit extends it with its own connector, wallet and network events to type {@link AppKitEmitter}.
 *
 * @extract
 * @public
 * @category Type
 * @section Core
 */
export type { SharedKitEvents } from '@ton/walletkit';
