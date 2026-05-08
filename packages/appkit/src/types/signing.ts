/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Network } from './network';
import type { Base64String } from './primitives';

// SignData types for wallet adapter

/**
 * Data to be signed by the wallet, discriminated by type.
 */
export type SignData =
    | { type: 'text'; value: SignDataText }
    | { type: 'binary'; value: SignDataBinary }
    | { type: 'cell'; value: SignDataCell };

/**
 * Binary data to be signed.
 */
export interface SignDataBinary {
    /**
     * Raw binary content encoded as bytes in Base64
     */
    content: Base64String;
}

/**
 * TON Cell data to be signed with a schema definition.
 */
export interface SignDataCell {
    /**
     * Schema describing the cell structure for parsing
     */
    schema: string;
    /**
     * Cell content encoded in Base64
     */
    content: Base64String;
}

/**
 * Plain text data to be signed.
 */
export interface SignDataText {
    /**
     * Text content to be signed
     */
    content: string;
}

/**
 * Sign-data payload sent to {@link WalletInterface}`.signData` — discriminated by `data.type` (`'text'`, `'binary'`, or `'cell'`).
 *
 * @public
 * @category Type
 * @section Signing
 */
export interface SignDataRequest {
    /** Network to issue the sign request against; defaults to the wallet's current network. */
    network?: Network;
    /** Sender address in raw format; usually omitted, the wallet fills it in. */
    from?: string;
    /** Payload the user is asked to sign. */
    data: SignData;
}

/**
 * Wallet response to a {@link SignDataRequest} — carries the signature plus the canonicalized address, timestamp, and domain the wallet committed to.
 *
 * @public
 * @category Type
 * @section Signing
 */
export interface SignDataResponse {
    /** Base64-encoded signature. */
    signature: string;
    /** Wallet address that signed, in user-friendly format. */
    address: string;
    /** Unix timestamp the wallet stamped onto the signature. */
    timestamp: number;
    /** dApp domain the wallet bound the signature to. */
    domain: string;
    /** Original payload that was signed, echoed back for binding. */
    payload: SignDataRequest;
}
