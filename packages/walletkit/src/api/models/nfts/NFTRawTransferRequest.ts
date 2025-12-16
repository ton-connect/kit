/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Base64String, UserFriendlyAddress } from '../core/Primitives';
import type { TokenAmount } from '../core/TokenAmount';

/**
 * Request raw parameters for transferring an NFT to another address.
 */
export interface NFTRawTransferRequest {
    /**
     * Contract address of the NFT to transfer
     */
    nftAddress: UserFriendlyAddress;

    /**
     * TON amount to attach for gas fees (default: 0.1 TON)
     */
    transferAmount: TokenAmount;

    /**
     * Transfer message details
     */
    message: NFTRawTransferRequestMessage;
}

export interface NFTRawTransferRequestMessage {
    /**
     * @format bigInt
     */
    queryId: string;

    newOwner: UserFriendlyAddress;
    responseDestination?: UserFriendlyAddress;
    customPayload?: Base64String;

    /**
     * @format bigInt
     */
    forwardAmount: string;

    forwardPayload?: Base64String;
}
