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

/** SignData Request Payload - sent to wallet */
export interface SignDataRequest {
    /** Network */
    network?: Network;
    /** Sender address in raw format */
    from?: string;
    /** Data to sign */
    data: SignData;
}

/** SignData Response - returned from wallet */
export interface SignDataResponse {
    /** Base64 encoded signature */
    signature: string;
    /** Wallet address that signed */
    address: string;
    /** Unix timestamp when signed */
    timestamp: number;
    /** Domain of the dApp */
    domain: string;
    /** Original payload that was signed */
    payload: SignDataRequest;
}

/**
 * SignMessage Response - returned from wallet.
 *
 * Wallet signs a transaction-shaped request with the internal message opcode
 * (instead of external), so the resulting BoC can be relayed on-chain by a
 * third party (e.g. a gasless relayer) rather than broadcast directly.
 */
export interface SignMessageResponse {
    /** Signed internal message BoC (base64) ready to be relayed */
    internalBoc: Base64String;
}
