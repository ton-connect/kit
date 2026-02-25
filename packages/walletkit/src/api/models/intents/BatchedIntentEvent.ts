/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { BridgeEvent } from '../bridge/BridgeEvent';
import type { IntentRequestEvent, IntentOrigin } from './IntentRequestEvent';

/**
 * A batched intent event containing multiple intent items
 * that should be processed as a group.
 *
 * Use cases:
 * - send TON + connect (intent with connect request)
 * - action intent that resolves to multiple steps
 */
export interface BatchedIntentEvent extends BridgeEvent {
    /** How the batch reached the wallet */
    origin: IntentOrigin;
    /** Client public key for response routing */
    clientId?: string;
    /** The intent requests in this batch */
    intents: IntentRequestEvent[];
    /** Whether a connect flow should follow after all intents are approved */
    hasConnectRequest: boolean;
}
