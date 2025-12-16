/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress, Hex } from '../core/Primitives';
import type { Network } from './Network';
import type { SignData } from './SignData';

/**
 * Prepared sign data ready for signing by the wallet.
 */
export interface PreparedSignData {
    /**
     * Wallet address that will sign the data
     */
    address: UserFriendlyAddress;
    /**
     * Unix timestamp when the sign request was created
     */
    timestamp: number;
    /**
     * Domain requesting the signature (e.g., "example.com")
     */
    domain: string;
    /**
     * Payload containing the data to be signed
     */
    payload: SignDataPayload;
    /**
     * Hash of the prepared sign data for verification
     */
    hash: Hex;
}

/**
 * Payload structure for prepared sign data.
 */
export interface SignDataPayload {
    /**
     * Network where the signing will occur
     */
    network?: Network;
    /**
     * Optional sender address
     */
    fromAddress?: UserFriendlyAddress;
    /**
     * Sign data content to be signed
     */
    data: SignData;
}

export interface UnpreparedSignData {
    payload: SignDataPayload;
    domain: string;
    address: UserFriendlyAddress;
}
