/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { Pagination, UserFriendlyAddress } from '../core/Primitives';

/**
 * Request parameters for fetching NFT tokens.
 */
export interface UserNFTsRequest {
    /**
     * Owner address of the NFTs
     */
    ownerAddress: UserFriendlyAddress;
    /**
     * Pagination information
     */
    pagination?: Pagination;
}
