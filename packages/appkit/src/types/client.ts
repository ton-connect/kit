/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Display metadata for a token (TON, jetton, or NFT) — name, symbol, image and animation as reported by the indexer; surfaced as {@link Jetton}'s `info` and {@link NFT}'s `info`.
 *
 * @extract
 * @public
 * @category Type
 * @section Client
 */
export type { TokenInfo } from '@ton/walletkit';

/**
 * Map of raw addresses to their resolved metadata, returned alongside indexed lists (e.g. {@link JettonsResponse}, {@link NFTsResponse}) so consumers can render labels without extra lookups.
 *
 * @extract
 * @public
 * @category Type
 * @section Client
 */
export type { AddressBook } from '@ton/walletkit';

/**
 * Single entry inside an {@link AddressBook} — pairs the user-friendly address with optional domain name and the list of contract interfaces it implements.
 *
 * @extract
 * @public
 * @category Type
 * @section Client
 */
export type { AddressBookEntry } from '@ton/walletkit';
