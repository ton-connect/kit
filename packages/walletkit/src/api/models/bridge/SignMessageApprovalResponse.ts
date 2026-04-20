/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Base64String } from '../core/Primitives';

/**
 * Response after user approves a sign-message request.
 */
export interface SignMessageApprovalResponse {
    /**
     * Signed internal message BoC (Bag of Cells) format, encoded in Base64.
     * This is a signed internal message (internal opcode) that the dApp can relay via a third-party relayer.
     */
    internalBoc: Base64String;
}
