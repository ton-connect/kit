/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { DAppInfo } from '../core/DAppInfo';
import { BridgeEvent } from './BridgeEvent';

/**
 * Event containing a connection request from a dApp via TON Connect.
 */
export interface ConnectionRequestEvent extends BridgeEvent {
    /**
     * Items requested by the dApp (e.g., wallet address, proof)
     */
    requestedItems: ConnectionRequestEventRequestedItem[];
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
     * Permissions requested by the dApp
     */
    permissions: ConnectionRequestEventPreviewPermission[];
    /**
     * Information about the requesting dApp
     */
    dAppInfo?: DAppInfo;
    /**
     * Error code if manifest fetching failed
     * @format int
     */
    manifestFetchErrorCode?: number;
}

/**
 * Data to be signed by the wallet, discriminated by type.
 */
export type ConnectionRequestEventRequestedItem =
    | { type: 'ton_addr' }
    | { type: 'ton_proof'; value: ConnectionRequestTonProofRequestedItem }
    | { type: 'unknown'; value: unknown }; // For future extensibility

/**
 * TON Proof request item.
 */
export interface ConnectionRequestTonProofRequestedItem {
    payload: string;
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
