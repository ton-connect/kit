/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Base64String, Hex } from '../core/Primitives';

export interface SendTransactionResponse {
    /**
     * BOC of the sent transaction
     * @format base64
     */
    boc: Base64String;
    /**
     * Normalized BOC of the external-in message
     * @format base64
     */
    normalizedBoc: Base64String;
    /**
     * Hash of the normalized external-in message
     * @format hex
     */
    normalizedHash: Hex;
}
