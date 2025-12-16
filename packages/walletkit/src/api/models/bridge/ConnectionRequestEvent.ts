/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { DAppInfo } from '../core/DAppInfo';
import type { BridgeEvent } from './BridgeEvent';

/**
 * Event containing a connection request from a dApp via TON Connect.
 */
export interface ConnectionRequestEvent extends BridgeEvent {
    /**
     * Preview information for UI display
     */
    preview: ConnectionRequestEventPreview;
}

/**
 * Preview data for displaying connection request in the wallet UI.
 */
export interface ConnectionRequestEventPreview {
    /**
     * Items requested by the dApp (e.g., wallet address, proof)
     */
    requestedItems: ConnectionRequestEventPreviewRequestedItem[];
    /**
     * Permissions requested by the dApp
     */
    permissions: ConnectionRequestEventPreviewPermission[];
    /**
     * Information about the requesting dApp
     */
    dAppInfo?: DAppInfo;
}

/**
 * Item requested by a dApp during connection.
 */
export interface ConnectionRequestEventPreviewRequestedItem {
    /**
     * Identifier name of the requested item
     */
    name: string;
    /**
     *
     */
    payload?: string;
}

/**
 * Permission requested by a dApp during connection.
 */
export interface ConnectionRequestEventPreviewPermission {
    /**
     * Identifier name of the permission
     */
    name?: string;
    /**
     * Human-readable title of the permission
     */
    title?: string;
    /**
     * Detailed description of what the permission allows
     */
    description?: string;
}
