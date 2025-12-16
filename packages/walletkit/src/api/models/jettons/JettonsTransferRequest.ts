/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { UserFriendlyAddress } from '../core/Primitives';
import type { TokenAmount } from '../core/TokenAmount';

/**
 * Request parameters for transferring Jetton tokens.
 */
export interface JettonsTransferRequest {
    /**
     * Jetton master contract address
     */
    jettonAddress: UserFriendlyAddress;

    /**
     * Amount to transfer in Jetton's smallest unit
     */
    transferAmount: TokenAmount;

    /**
     * Recipient wallet address
     */
    recipientAddress: UserFriendlyAddress;

    /**
     * Human-readable comment attached to the transfer
     */
    comment?: string;
}
