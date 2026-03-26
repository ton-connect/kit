/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TonConnectEventsHandler } from './TonConnectEventsHandler';

export interface TonConnectEventsRouter {
    add(eventsHandler: TonConnectEventsHandler): void;
    remove(eventsHandler: TonConnectEventsHandler): void;
}
