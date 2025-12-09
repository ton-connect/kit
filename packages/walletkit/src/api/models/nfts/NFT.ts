/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import { UserFriendlyAddress, Hex } from "../core/Primitives";
import { TokenInfo } from "../core/TokenInfo";
import { NFTAttribute } from "./NFTAttribute";
import { NFTCollection } from "./NFTCollection";

/**
 * Non-fungible token (NFT) on the TON blockchain.
 */
export interface NFT {
  /**
   * Contract address of the NFT item
   */
  address: UserFriendlyAddress;

  /**
   * Index of the item within its collection
   */
  index?: string;

  /**
   * Display information about the NFT (name, description, images)
   */
  info?: TokenInfo;

  /**
   * Custom attributes/traits of the NFT (e.g., rarity, properties)
   */
  attributes?: NFTAttribute[];

  /**
   * Information about the collection this item belongs to
   */
  collection?: NFTCollection;

  /**
   * Address of the auction contract, if the NFT is being auctioned
   */
  auctionContractAddress?: UserFriendlyAddress;

  /**
   * Hash of the NFT smart contract code
   */
  codeHash?: Hex;

  /**
   * Hash of the NFT's on-chain data
   */
  dataHash?: Hex;

  /**
   * Whether the NFT contract has been initialized
   */
  isInited?: boolean;

  /**
   * Whether the NFT is soulbound (non-transferable)
   */
  isSoulbound?: boolean;

  /**
   * Whether the NFT is currently listed for sale
   */
  isOnSale?: boolean;

  /**
   * Current owner address of the NFT
   */
  ownerAddress?: UserFriendlyAddress;

  /**
   * Real owner address when NFT is on sale (sale contract becomes temporary owner)
   */
  realOwnerAddress?: UserFriendlyAddress;

  /**
   * Address of the sale contract, if the NFT is listed for sale
   */
  saleContractAddress?: UserFriendlyAddress;

  /**
   * Off-chain metadata of the NFT (key-value pairs)
   */
  extra?: { [key: string]: unknown };
}
