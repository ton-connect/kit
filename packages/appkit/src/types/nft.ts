/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Non-fungible TEP-62 token held in the user's TON wallet — carries the contract address, optional collection link, owner, sale state, and on-chain metadata.
 *
 * @extract
 * @public
 * @category Type
 * @section NFTs
 */
export type { NFT } from '@ton/walletkit';

/**
 * Response payload of {@link getNfts} / {@link getNftsByAddress} — the list of {@link NFT}s plus an address book that resolves raw addresses inside it.
 *
 * @extract
 * @public
 * @category Type
 * @section NFTs
 */
export type { NFTsResponse } from '@ton/walletkit';

/**
 * Single trait of an {@link NFT} — `traitType` names the category (e.g., `"Background"`), `value` carries the trait's value (e.g., `"Blue"`).
 *
 * @extract
 * @public
 * @category Type
 * @section NFTs
 */
export type { NFTAttribute } from '@ton/walletkit';

/**
 * NFT collection (TEP-62) — surfaced as {@link NFT}`.collection` and carries the collection's name, image, owner and minting cursor.
 *
 * @extract
 * @public
 * @category Type
 * @section NFTs
 */
export type { NFTCollection } from '@ton/walletkit';
