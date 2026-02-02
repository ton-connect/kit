/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { AddressBook } from '../core/AddressBook';
import type { NFT } from './NFT';

/**
 * Response containing a list of NFT tokens.
 */
export interface NFTsResponse {
    /**
     * Address book entries related to the NFTs
     */
    addressBook?: AddressBook;
    /**
     * List of NFTs
     */
    nfts: NFT[];
}
