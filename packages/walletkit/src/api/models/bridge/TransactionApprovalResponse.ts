/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Base64String } from '../core/Primitives';

/**
 * Response after user approves a transaction request.
 */
export interface TransactionApprovalResponse {
    /**
     * Signed transaction in BOC (Bag of Cells) format, encoded in Base64
     */
    signedBoc: Base64String;
}
