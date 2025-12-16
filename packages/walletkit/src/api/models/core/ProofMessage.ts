/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Base64String, Hex } from '../core/Primitives';

/**
 * Message structure used for TON Connect proof of ownership.
 */
export interface ProofMessage {
    /**
     * Workchain ID of the wallet address
     * @format int
     */
    workchain: number;
    /**
     * Wallet address hash in hexadecimal format
     */
    addressHash: Hex;
    /**
     * Unix timestamp when the proof was created
     * @format timestamp
     */
    timestamp: number;
    /**
     * Domain information for the proof request
     */
    domain: ProofMessageDomain;
    /**
     * Payload string to be signed
     */
    payload: string;
    /**
     * Initial state of the wallet contract encoded in Base64
     */
    stateInit: Base64String;
    /**
     * Cryptographic signature of the proof message
     */
    signature?: Hex;
}

/**
 * Domain information for proof message verification.
 */
interface ProofMessageDomain {
    /**
     * Length of the domain value in bytes
     * @format uint32
     */
    lengthBytes: number;
    /**
     * Domain name string (e.g., "example.com")
     */
    value: string;
}
