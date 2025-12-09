/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { NFT } from "./NFT";

/**
 * Response containing a list of NFT tokens.
 */
export interface NFTsResponse {
  /**
   * List of NFTs
   */
  nfts: NFT[];
}
