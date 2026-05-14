/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TransactionRequest } from '../transactions/TransactionRequest';
import type { BridgeEvent } from './BridgeEvent';
import type { SendTransactionRequestEventPreview } from './SendTransactionRequestEvent';

/**
 * Event containing a sign-message (sign-only transaction) request from a dApp via TON Connect.
 * The wallet signs the transaction using the internal opcode and returns the signed BoC
 * without broadcasting it on-chain.
 */
export interface SignMessageRequestEvent extends BridgeEvent {
    /**
     * Preview information for UI display
     */
    preview: SendTransactionRequestEventPreview;

    /**
     * Raw transaction request data
     */
    request: TransactionRequest;
}
