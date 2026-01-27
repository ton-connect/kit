/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TransactionEmulatedPreview } from '../transactions/emulation/TransactionEmulatedPreview';
import type { TransactionRequest } from '../transactions/TransactionRequest';
import type { BridgeEvent } from './BridgeEvent';

/**
 * Event containing a signMessage request from a dApp via TON Connect.
 * This is used for gasless transactions where the wallet signs an internal message
 * that a gasless provider will wrap and send to the network.
 * 
 * The request structure is identical to sendTransaction, but the result
 * is a signed internal message BOC instead of an external message.
 */
export interface SignMessageRequestEvent extends BridgeEvent {
    /**
     * Preview information for UI display
     */
    preview: SignMessageRequestEventPreview;
    /**
     * Raw transaction request data (same structure as sendTransaction)
     */
    request: TransactionRequest;
}

/**
 * Preview data for displaying signMessage request in the wallet UI.
 */
export interface SignMessageRequestEventPreview {
    /**
     * Emulated transaction preview with actions and traces
     */
    data?: TransactionEmulatedPreview;
}

/**
 * Response from approving a signMessage request.
 */
export interface SignMessageApprovalResponse {
    /**
     * The signed internal message BOC (Base64 encoded).
     * This can be sent to a gasless provider for execution.
     */
    signedInternalBoc: string;
}
