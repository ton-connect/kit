/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { NftCollection } from "../../types/toncenter/NftCollection";
import type { NFTCollection } from "../models/nfts/NFTCollection";
import type { TokenImage } from "../models/core/TokenImage";
import { Mapper } from "./Mapper";
import { UserFriendlyAddressMapper } from "./UserFriendlyAddressMapper";
import { HexMapper } from "./HexMapper";

/**
 * Maps internal NftCollection to API NFTCollection model.
 */
export class NFTCollectionMapper extends Mapper<
  NftCollection,
  NFTCollection | undefined
> {
  private addressMapper = new UserFriendlyAddressMapper();
  private hexMapper = new HexMapper();

  /**
   * Creates a minimal NFTCollection with only the address.
   * Returns undefined if address conversion fails.
   */
  mapAddress(address: string): NFTCollection | undefined {
    const userFriendlyAddress = this.addressMapper.map(address);
    if (userFriendlyAddress === undefined) {
      return undefined;
    }
    return { address: userFriendlyAddress };
  }

  private extractImage(input: NftCollection): TokenImage | undefined {
    const image = input.image;
    const extra = input.extra;

    if (!image && !extra) {
      return undefined;
    }

    return {
      url: image ?? extra?.cover_image ?? extra?.uri,
      smallUrl: extra?._image_small,
      mediumUrl: extra?._image_medium,
      largeUrl: extra?._image_big,
    };
  }

  map(input: NftCollection): NFTCollection | undefined {
    const address = this.addressMapper.map(input.address);
    if (address === undefined) {
      return undefined;
    }

    const ownerAddress = input.ownerAddress
      ? this.addressMapper.map(input.ownerAddress)
      : undefined;

    return {
      address,
      name: input.name,
      description: input.description,
      image: this.extractImage(input),
      nextItemIndex: input.nextItemIndex,
      codeHash: input.codeHash ? this.hexMapper.map(input.codeHash) : undefined,
      dataHash: input.dataHash ? this.hexMapper.map(input.dataHash) : undefined,
      ownerAddress,
      extra: input.extra,
    };
  }
}
