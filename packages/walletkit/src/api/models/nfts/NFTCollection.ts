/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { TokenImage } from '../core/TokenImage';
import type { UserFriendlyAddress, Hex } from '../core/Primitives';

/**
 * NFT collection on the TON blockchain (TEP-62 standard).
 */
export interface NFTCollection {
    /**
     * The blockchain address of the NFT collection contract
     */
    address: UserFriendlyAddress;

    /**
     * The name of the NFT collection
     */
    name?: string;

    /**
     * The image representing the NFT collection
     */
    image?: TokenImage;

    /**
     * A brief description of the NFT collection
     */
    description?: string;

    /**
     * The index value for the next item to be minted in the collection
     */
    nextItemIndex?: string;

    /**
     * The hash of the collection's smart contract code
     */
    codeHash?: Hex;

    /**
     * The hash of the collection's data in the blockchain
     */
    dataHash?: Hex;

    /**
     * The blockchain address of the collection owner
     */
    ownerAddress?: UserFriendlyAddress;

    /**
     * Additional arbitrary data related to the NFT collection
     */
    extra?: { [key: string]: unknown };
}
