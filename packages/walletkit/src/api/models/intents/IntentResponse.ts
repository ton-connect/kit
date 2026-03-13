/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Base64String, UserFriendlyAddress } from '../core/Primitives';
import type { SignDataPayload } from '../core/PreparedSignData';

/**
 * Successful response for transaction intent.
 */
export interface IntentTransactionResponse {
    type: 'transaction';
    /** Signed BoC (base64) */
    boc: Base64String;
}

/**
 * Successful response for sign data intent.
 */
export interface IntentSignDataResponse {
    type: 'signData';
    /** Signature (base64) */
    signature: Base64String;
    /** Signer address */
    address: UserFriendlyAddress;
    /**
     * UNIX timestamp (seconds, UTC)
     * @format timestamp
     */
    timestamp: number;
    /** App domain */
    domain: string;
    /** Echoed payload from the request */
    payload: SignDataPayload;
}

/**
 * Error response for any intent.
 */
export interface IntentErrorResponse {
    type: 'error';
    /** Error details */
    error: IntentError;
}

/**
 * Intent error details.
 */
export interface IntentError {
    /**
     * Error code
     * @format int
     */
    code: number;
    /** Human-readable message */
    message: string;
}

/**
 * Union of all intent responses, discriminated by `type`.
 * @discriminator type
 */
export type IntentResponseResult = IntentTransactionResponse | IntentSignDataResponse | IntentErrorResponse;
