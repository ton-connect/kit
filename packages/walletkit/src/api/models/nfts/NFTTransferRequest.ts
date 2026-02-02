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
 * Request parameters for transferring an NFT to another address.
 */
export interface NFTTransferRequest {
    /**
     * Contract address of the NFT to transfer
     */
    nftAddress: UserFriendlyAddress;

    /**
     * TON amount to attach for gas fees (default: 0.1 TON)
     */
    transferAmount?: TokenAmount;

    /**
     * Recipient wallet address
     */
    recipientAddress: UserFriendlyAddress;

    /**
     * Human-readable comment attached to the transfer
     */
    comment?: string;
}
