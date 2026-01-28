/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Base64String } from '../core/Primitives';

/**
 * Response after user approves a connection request.
 */
export interface ConnectionApprovalResponse {
    proof: ConnectionApprovalProof;
}

export interface ConnectionApprovalProof {
    signature: Base64String;
    timestamp: number;
    domain: ConnectionApprovalProofDomain;
}

export interface ConnectionApprovalProofDomain {
    /**
     * @format int
     */
    lengthBytes: number;
    value: string;
}
