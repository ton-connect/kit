/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { BridgeEvent } from './BridgeEvent';
import type { DAppInfo } from '../core/DAppInfo';

/**
 * Event indicating a dApp has disconnected from the wallet.
 */
export interface DisconnectionEvent extends BridgeEvent {
    /**
     * Preview information for UI display
     */
    preview: DisconnectionEventPreview;
}

/**
 * Preview data for displaying disconnection event in the wallet UI.
 */
export interface DisconnectionEventPreview {
    /**
     * Human-readable reason for the disconnection
     */
    reason?: string;
    /**
     * Information about the disconnected dApp
     */
    dAppInfo?: DAppInfo;
}
