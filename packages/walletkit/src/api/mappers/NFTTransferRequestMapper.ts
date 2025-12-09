/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NftTransferParamsHuman } from "../../types/nfts";
import type { NFTTransferRequest } from "../models/nfts/NFTTransferRequest";
import { Mapper } from "./Mapper";

/**
 * Maps API NFTTransferRequest to internal NftTransferParamsHuman.
 */
export class NFTTransferRequestMapper extends Mapper<
  NFTTransferRequest,
  NftTransferParamsHuman
> {
  map(input: NFTTransferRequest): NftTransferParamsHuman {
    return {
      nftAddress: input.nftAddress,
      toAddress: input.recipientAddress,
      transferAmount: input.transferAmount ?? "100000000",
      comment: input.comment,
    };
  }
}
