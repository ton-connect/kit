/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NftItem } from "../../types/toncenter/NftItem";
import type { NFT } from "../models/nfts/NFT";
import { Mapper } from "./Mapper";
import { NFTAttributeMapper } from "./NFTAttributeMapper";
import { NFTCollectionMapper } from "./NFTCollectionMapper";
import { TokenInfoMapper } from "./TokenInfoMapper";
import { UserFriendlyAddressMapper } from "./UserFriendlyAddressMapper";
import { HexMapper } from "./HexMapper";

/**
 * Maps NftItem to API NFT model.
 */
export class NFTMapper extends Mapper<NftItem, NFT> {
  private attributeMapper = new NFTAttributeMapper();
  private collectionMapper = new NFTCollectionMapper();
  private tokenInfoMapper = new TokenInfoMapper();
  private addressMapper = new UserFriendlyAddressMapper();
  private hexMapper = new HexMapper();

  map(input: NftItem): NFT {
    return {
      address: input.address,
      index: input.index,
      info: input.metadata
        ? this.tokenInfoMapper.mapFromNft(input.metadata)
        : undefined,
      attributes: input.attributes?.map((attr) =>
        this.attributeMapper.map(attr),
      ),
      collection: input.collection
        ? this.collectionMapper.map(input.collection)
        : undefined,
      auctionContractAddress: input.auctionContractAddress
        ? this.addressMapper.map(input.auctionContractAddress)
        : undefined,
      codeHash: input.codeHash ? this.hexMapper.map(input.codeHash) : undefined,
      dataHash: input.dataHash ? this.hexMapper.map(input.dataHash) : undefined,
      isInited: input.init,
      isSoulbound: input.isSbt,
      isOnSale: input.onSale,
      ownerAddress: input.ownerAddress
        ? this.addressMapper.map(input.ownerAddress)
        : undefined,
      realOwnerAddress: input.realOwner
        ? this.addressMapper.map(input.realOwner)
        : undefined,
      saleContractAddress: input.saleContractAddress
        ? this.addressMapper.map(input.saleContractAddress)
        : undefined,
      extra: input.content,
    };
  }
}
