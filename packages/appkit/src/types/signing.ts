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
 * Payload the user is asked to sign — discriminated union over `'text'`, `'binary'`, and `'cell'`; nested under {@link SignDataRequest}`.data`.
 *
 * @public
 * @category Type
 * @section Signing
 */
export type SignData =
    | { type: 'text'; value: SignDataText }
    | { type: 'binary'; value: SignDataBinary }
    | { type: 'cell'; value: SignDataCell };

/**
 * Binary variant of {@link SignData} — opaque byte content the user is asked to sign.
 *
 * @public
 * @category Type
 * @section Signing
 */
export interface SignDataBinary {
    /** Raw binary content encoded as Base64. */
    content: Base64String;
}

/**
 * TON cell variant of {@link SignData} — Base64-encoded cell payload paired with the schema needed to parse it.
 *
 * @public
 * @category Type
 * @section Signing
 */
export interface SignDataCell {
    /** TL-B-style schema describing the cell layout so the wallet can render the payload to the user. */
    schema: string;
    /** Cell content encoded as Base64. */
    content: Base64String;
}

/**
 * Plain-text variant of {@link SignData} — UTF-8 string the user is asked to sign.
 *
 * @public
 * @category Type
 * @section Signing
 */
export interface SignDataText {
    /** UTF-8 text the user signs. */
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
