/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { Pagination } from "../core/Primitives";

/**
 * Request parameters for fetching NFT tokens.
 */
export interface NFTsRequest {
  /**
   * Pagination information
   */
  pagination: Pagination;
}
