/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { NftItems } from "../..";
import type { NFTsResponse } from "../models/nfts/NFTsResponse";
import { Mapper } from "./Mapper";
import { NFTMapper } from "./NftMapper";

/**
 * Maps array of NftItem to API NFTsResponse model.
 */
export class NFTsResponseMapper extends Mapper<NftItems, NFTsResponse> {
  private nftMapper = new NFTMapper();

  map(input: NftItems): NFTsResponse {
    return {
      nfts: input.items.map((nft) => this.nftMapper.map(nft)),
    };
  }
}
