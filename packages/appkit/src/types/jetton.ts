/**
 * Copyright (c) TonTech.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

/**
 * Fungible TEP-74 token held in the user's TON wallet — carries the master contract address, the user's jetton-wallet address, current balance, and token metadata.
 *
 * @extract
 * @public
 * @category Type
 * @section Jettons
 */
export type { Jetton } from '@ton/walletkit';

/**
 * Token metadata for a jetton master — name, symbol, decimals, image, and verification status as reported by the indexer.
 *
 * @extract
 * @public
 * @category Type
 * @section Jettons
 */
export type { JettonInfo } from '@ton/walletkit';

/**
 * Response payload of {@link getJettons} / {@link getJettonsByAddress} — the list of {@link Jetton}s plus the address book that resolves raw addresses inside it.
 *
 * @extract
 * @public
 * @category Type
 * @section Jettons
 */
export type { JettonsResponse } from '@ton/walletkit';

/**
 * Display metadata for a token (TON, jetton, or NFT) — name, symbol, image and animation as reported by the indexer; surfaced as {@link Jetton}`.info`.
 *
 * @extract
 * @public
 * @category Type
 * @section Jettons
 */
export type { TokenInfo } from '@ton/walletkit';

/**
 * Verification metadata reported by the indexer for a {@link JettonInfo} — `verified` flag plus optional verifier source.
 *
 * @extract
 * @public
 * @category Type
 * @section Jettons
 */
export type { JettonVerification } from '@ton/walletkit';

/**
 * Map of raw addresses to their resolved metadata, returned alongside indexed lists (e.g. {@link JettonsResponse}) so consumers can render labels without extra lookups.
 *
 * @extract
 * @public
 * @category Type
 * @section Jettons
 */
export type { AddressBook } from '@ton/walletkit';

/**
 * Single entry inside an {@link AddressBook} — pairs the user-friendly address with optional domain name and the list of contract interfaces it implements.
 *
 * @extract
 * @public
 * @category Type
 * @section Jettons
 */
export type { AddressBookEntry } from '@ton/walletkit';
