/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NftItemAttribute } from "../../types/toncenter/NftItem";
import type { NFTAttribute } from "../models/nfts/NFTAttribute";
import { Mapper } from "./Mapper";

/**
 * Maps NftItemAttribute to API NFTAttribute model.
 */
export class NFTAttributeMapper extends Mapper<NftItemAttribute, NFTAttribute> {
  map(input: NftItemAttribute): NFTAttribute {
    return {
      traitType: input.trait_type,
      value: input.value,
    };
  }
}
