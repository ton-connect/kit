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
 * Event containing a transaction request from a dApp via TON Connect.
 */
export interface SendTransactionRequestEvent extends BridgeEvent {
    /**
     * Preview information for UI display
     */
    preview: SendTransactionRequestEventPreview;
    /**
     * Raw transaction request data
     */
    request: TransactionRequest;
    /**
     * Raw TonConnect return strategy string.
     */
    returnStrategy?: string;
}

/**
 * Preview data for displaying transaction request in the wallet UI.
 */
export interface SendTransactionRequestEventPreview {
    /**
     * Emulated transaction preview with actions and traces
     */
    data?: TransactionEmulatedPreview;
}
