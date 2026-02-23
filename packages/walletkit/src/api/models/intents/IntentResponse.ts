/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Successful response for transaction intent.
 */
export interface IntentTransactionResponse {
    /** Result type discriminator */
    resultType: 'transaction';
    /** Signed BoC (base64) */
    boc: string;
}

/**
 * Successful response for sign data intent.
 */
export interface IntentSignDataResponse {
    /** Result type discriminator */
    resultType: 'signData';
    /** Signature (base64) */
    signature: string;
    /** Signer address (raw format: 0:hex) */
    address: string;
    /** UNIX timestamp (seconds, UTC) */
    timestamp: number;
    /** App domain */
    domain: string;
}

/**
 * Error response for any intent.
 */
export interface IntentErrorResponse {
    /** Result type discriminator */
    resultType: 'error';
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
 * Union of all intent responses.
 */
export type IntentResponseResult = IntentTransactionResponse | IntentSignDataResponse | IntentErrorResponse;
